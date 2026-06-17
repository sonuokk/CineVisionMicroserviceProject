from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Image as RLImage,
    Table,
    TableStyle,
    Preformatted,
)


ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "generated_webdotnet_answer_pdf"
DIAGRAM_DIR = OUT_DIR / "diagrams"
OUT_PDF = OUT_DIR / "Web_Development_NET_Framework_Combined_Answers_PDF1_to_PDF5.pdf"


def ensure_dirs():
    OUT_DIR.mkdir(exist_ok=True)
    DIAGRAM_DIR.mkdir(exist_ok=True)


def font(size=26, bold=False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def text_box(draw, box, text, fill, outline, txt=(30, 40, 50), size=24, bold=False):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=18, fill=fill, outline=outline, width=3)
    f = font(size, bold)
    max_chars = max(12, int((x2 - x1) / (size * 0.52)))
    lines = []
    for part in text.split("\n"):
        lines.extend(wrap(part, max_chars) or [""])
    line_h = size + 7
    total = line_h * len(lines)
    y = y1 + ((y2 - y1) - total) / 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=f)
        w = bbox[2] - bbox[0]
        draw.text((x1 + ((x2 - x1) - w) / 2, y), line, font=f, fill=txt)
        y += line_h


def arrow(draw, start, end, color=(45, 65, 85), width=5):
    draw.line([start, end], fill=color, width=width)
    sx, sy = start
    ex, ey = end
    if abs(ex - sx) >= abs(ey - sy):
        if ex >= sx:
            pts = [(ex, ey), (ex - 18, ey - 10), (ex - 18, ey + 10)]
        else:
            pts = [(ex, ey), (ex + 18, ey - 10), (ex + 18, ey + 10)]
    else:
        if ey >= sy:
            pts = [(ex, ey), (ex - 10, ey - 18), (ex + 10, ey - 18)]
        else:
            pts = [(ex, ey), (ex - 10, ey + 18), (ex + 10, ey + 18)]
    draw.polygon(pts, fill=color)


def make_diagram(name, title, boxes, arrows):
    path = DIAGRAM_DIR / f"{name}.png"
    img = Image.new("RGB", (1400, 850), (250, 252, 255))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 1400, 850], fill=(250, 252, 255))
    d.text((70, 40), title, font=font(38, True), fill=(24, 42, 60))
    palette = [
        ((232, 244, 255), (56, 114, 178)),
        ((239, 248, 235), (79, 142, 82)),
        ((255, 246, 229), (191, 128, 38)),
        ((246, 238, 255), (124, 80, 160)),
        ((235, 249, 249), (40, 134, 142)),
        ((255, 238, 238), (184, 76, 76)),
    ]
    centers = {}
    for i, (key, label, box) in enumerate(boxes):
        fill, outline = palette[i % len(palette)]
        text_box(d, box, label, fill, outline, size=24, bold=True)
        x1, y1, x2, y2 = box
        centers[key] = ((x1 + x2) // 2, (y1 + y2) // 2, box)
    for a, b in arrows:
        ax, ay, abox = centers[a]
        bx, by, bbox = centers[b]
        x1, y1, x2, y2 = abox
        u1, v1, u2, v2 = bbox
        if bx > ax:
            start = (x2, ay)
            end = (u1, by)
        elif bx < ax:
            start = (x1, ay)
            end = (u2, by)
        elif by > ay:
            start = (ax, y2)
            end = (bx, v1)
        else:
            start = (ax, y1)
            end = (bx, v2)
        arrow(d, start, end)
    img.save(path)
    return str(path)


def build_diagrams():
    diagrams = {}
    diagrams["dotnet_arch"] = make_diagram(
        "dotnet_architecture",
        ".NET Framework Architecture",
        [
            ("lang", "C#, VB.NET,\nF# Source Code", (70, 150, 330, 270)),
            ("compiler", "Language\nCompilers", (430, 150, 690, 270)),
            ("msil", "MSIL + Metadata\nin Assembly", (790, 150, 1080, 270)),
            ("clr", "CLR\nJIT, GC, Security", (530, 390, 850, 530)),
            ("fcl", "Framework Class Library\nASP.NET, ADO.NET, WinForms", (190, 620, 610, 760)),
            ("os", "Operating System\nand Hardware", (780, 620, 1190, 760)),
        ],
        [("lang", "compiler"), ("compiler", "msil"), ("msil", "clr"), ("clr", "fcl"), ("clr", "os")],
    )
    diagrams["jit_flow"] = make_diagram(
        "jit_flow",
        "MSIL and JIT Compilation Flow",
        [
            ("source", "C# / VB.NET\nProgram", (90, 170, 330, 290)),
            ("compile", "Compiler", (430, 170, 650, 290)),
            ("il", "MSIL + Metadata\nAssembly", (750, 170, 1030, 290)),
            ("verify", "CLR Verification\nType Safety", (250, 430, 540, 560)),
            ("jit", "JIT Compiler\nMethod by Method", (650, 430, 950, 560)),
            ("native", "Native Machine Code\nExecution", (520, 650, 900, 770)),
        ],
        [("source", "compile"), ("compile", "il"), ("il", "verify"), ("verify", "jit"), ("jit", "native")],
    )
    diagrams["component_model"] = make_diagram(
        "component_model",
        "Generations of Microsoft Component Model",
        [
            ("com", "COM\nReusable binary components\nInterfaces and Registry", (80, 220, 390, 390)),
            ("comp", "COM+\nTransactions, pooling,\nrole security", (540, 220, 860, 390)),
            ("net", ".NET Components\nAssemblies, metadata,\nmanaged execution", (1010, 220, 1320, 390)),
            ("issues", "Main Progression\nFrom registration problems to safer deployment", (380, 580, 1020, 720)),
        ],
        [("com", "comp"), ("comp", "net"), ("net", "issues")],
    )
    diagrams["oop"] = make_diagram(
        "oop_pillars",
        "Four Pillars of Object-Oriented Programming",
        [
            ("enc", "Encapsulation\nData + methods\nwith protection", (100, 170, 430, 330)),
            ("abs", "Abstraction\nShow essentials,\nhide details", (520, 170, 850, 330)),
            ("inh", "Inheritance\nReuse base class\nfeatures", (100, 500, 430, 660)),
            ("poly", "Polymorphism\nOne interface,\nmany forms", (520, 500, 850, 660)),
            ("class", "Class and Object\nDesign", (1000, 330, 1280, 500)),
        ],
        [("enc", "class"), ("abs", "class"), ("inh", "class"), ("poly", "class")],
    )
    diagrams["inheritance"] = make_diagram(
        "inheritance_types",
        "Multilevel and Hierarchical Inheritance",
        [
            ("animal", "Animal", (130, 140, 370, 240)),
            ("dog", "Dog", (130, 330, 370, 430)),
            ("puppy", "Puppy", (130, 520, 370, 620)),
            ("shape", "Shape", (790, 150, 1030, 250)),
            ("circle", "Circle", (620, 430, 860, 530)),
            ("rect", "Rectangle", (970, 430, 1210, 530)),
        ],
        [("animal", "dog"), ("dog", "puppy"), ("shape", "circle"), ("shape", "rect")],
    )
    diagrams["delegate"] = make_diagram(
        "delegate_flow",
        "Delegate Declaration and Invocation",
        [
            ("decl", "Declare Delegate\nSignature", (80, 210, 360, 340)),
            ("method", "Create Method\nSame Signature", (450, 210, 730, 340)),
            ("obj", "Create Delegate\nObject", (820, 210, 1100, 340)),
            ("call", "Invoke Delegate\nCalls Method", (540, 540, 870, 680)),
        ],
        [("decl", "method"), ("method", "obj"), ("obj", "call")],
    )
    diagrams["adonet"] = make_diagram(
        "adonet_object_model",
        "ADO.NET Object Model",
        [
            ("app", ".NET Application\nWinForms / ASP.NET", (70, 170, 390, 300)),
            ("conn", "Connection\nDatabase Link", (500, 120, 760, 240)),
            ("cmd", "Command\nSQL / Procedure", (500, 310, 760, 430)),
            ("reader", "DataReader\nConnected, fast", (890, 120, 1180, 240)),
            ("adapter", "DataAdapter\nBridge", (890, 310, 1180, 430)),
            ("dataset", "DataSet\nDisconnected cache", (500, 560, 820, 700)),
            ("tables", "DataTable, DataView,\nDataRelation", (930, 560, 1250, 700)),
        ],
        [("app", "conn"), ("conn", "cmd"), ("cmd", "reader"), ("cmd", "adapter"), ("adapter", "dataset"), ("dataset", "tables")],
    )
    diagrams["dataset"] = make_diagram(
        "dataset_model",
        "DataSet Model",
        [
            ("ds", "DataSet", (560, 120, 840, 230)),
            ("t1", "DataTable\nStudents", (160, 390, 460, 520)),
            ("t2", "DataTable\nCourses", (560, 390, 860, 520)),
            ("t3", "DataTable\nMarks", (960, 390, 1260, 520)),
            ("rel", "DataRelation\nConstraints\nRows and Columns", (450, 650, 950, 780)),
        ],
        [("ds", "t1"), ("ds", "t2"), ("ds", "t3"), ("t1", "rel"), ("t2", "rel"), ("t3", "rel")],
    )
    diagrams["win_lifecycle"] = make_diagram(
        "windows_form_lifecycle",
        "Windows Forms Life Cycle",
        [
            ("ctor", "Constructor", (80, 180, 310, 290)),
            ("load", "Load Event", (400, 180, 630, 290)),
            ("shown", "Shown / Activated", (720, 180, 1000, 290)),
            ("run", "User Interaction\nClick, Change, Key", (520, 430, 890, 570)),
            ("closing", "FormClosing", (330, 670, 590, 780)),
            ("closed", "FormClosed\nDispose", (720, 670, 980, 780)),
        ],
        [("ctor", "load"), ("load", "shown"), ("shown", "run"), ("run", "closing"), ("closing", "closed")],
    )
    diagrams["page_lifecycle"] = make_diagram(
        "aspnet_page_lifecycle",
        "ASP.NET Page Life Cycle",
        [
            ("request", "Page Request", (80, 150, 310, 260)),
            ("start", "Start\nIsPostBack", (390, 150, 620, 260)),
            ("init", "Init", (700, 150, 930, 260)),
            ("load", "Load", (1010, 150, 1240, 260)),
            ("events", "PostBack Events\nButton, List", (240, 450, 560, 580)),
            ("render", "PreRender\nRender HTML", (650, 450, 970, 580)),
            ("unload", "Unload", (1060, 450, 1290, 580)),
        ],
        [("request", "start"), ("start", "init"), ("init", "load"), ("load", "events"), ("events", "render"), ("render", "unload")],
    )
    diagrams["state"] = make_diagram(
        "state_management",
        "ASP.NET State Management",
        [
            ("client", "Client-side\nCookies, ViewState,\nQueryString", (160, 230, 520, 400)),
            ("server", "Server-side\nSession, Cache,\nApplication", (850, 230, 1210, 400)),
            ("http", "HTTP is Stateless\nState tools remember data", (430, 560, 940, 710)),
        ],
        [("client", "http"), ("server", "http")],
    )
    diagrams["databinding"] = make_diagram(
        "data_binding",
        "ASP.NET Data Binding",
        [
            ("db", "Database", (100, 240, 340, 360)),
            ("source", "Data Source Control\nSqlDataSource", (450, 220, 760, 380)),
            ("bound", "Data-bound Control\nGridView / DetailsView", (880, 220, 1250, 380)),
            ("page", "Web Page Output\nHTML Table/List", (520, 570, 900, 710)),
        ],
        [("db", "source"), ("source", "bound"), ("bound", "page")],
    )
    diagrams["auth"] = make_diagram(
        "auth_flow",
        "Authentication and Authorization",
        [
            ("user", "User Login\nCredentials", (100, 230, 400, 360)),
            ("authn", "Authentication\nWho are you?", (530, 150, 860, 290)),
            ("authz", "Authorization\nWhat can you access?", (530, 430, 860, 570)),
            ("resource", "Protected Page\nor Resource", (980, 300, 1280, 440)),
        ],
        [("user", "authn"), ("authn", "authz"), ("authz", "resource")],
    )
    diagrams["webservice"] = make_diagram(
        "web_service_architecture",
        "Web Service Integration",
        [
            ("client", "Client Application\nAny platform", (100, 230, 420, 380)),
            ("protocol", "HTTP + XML/JSON\nSOAP or REST", (540, 230, 860, 380)),
            ("service", ".NET Web Service\nBusiness Logic", (980, 230, 1300, 380)),
            ("db", "Database / External\nSystems", (590, 590, 920, 720)),
        ],
        [("client", "protocol"), ("protocol", "service"), ("service", "db")],
    )
    return diagrams


PDFS = [
    {
        "title": "PDF 1 - Web Development Using .NET Framework",
        "subtitle": "Question Paper 1 Answers",
        "questions": [
            ("Question 1", [
                ("i. VOS", "VOS means Virtual Object System in the Common Type System area of .NET. It gives a common object model for all .NET languages, so objects, values, interfaces, arrays, delegates, and exceptions can be represented in a uniform way. Because of this common model, a class written in C# can be used by VB.NET or another .NET language without rewriting the logic. VOS supports type safety, inheritance, method calling, object identity, and value/reference type distinction."),
                ("ii. Four inbuilt libraries", "Important inbuilt .NET libraries include System, System.Data, System.Web, and System.Windows.Forms. System provides basic classes such as String, Console, Math, Exception, and collections. System.Data supports ADO.NET database programming. System.Web supports ASP.NET pages, controls, sessions, and web services. System.Windows.Forms provides classes for desktop GUI applications."),
                ("iii. C# as true object-oriented language", "C# is considered a true object-oriented language because programs are mainly written using classes and objects. It supports encapsulation through access modifiers, inheritance through base and derived classes, polymorphism through overloading and overriding, and abstraction through abstract classes and interfaces. C# also supports properties, delegates, events, constructors, destructors, and exception handling, which make object-oriented design practical."),
                ("iv. One type of inheritance", "Single inheritance is one important type of inheritance in C#. In single inheritance, one derived class inherits from one base class. For example, Student can inherit from Person. The derived class reuses common data and methods from the base class and adds its own specific features. C# supports single class inheritance directly, while multiple inheritance is achieved through interfaces."),
                ("v. Modal and modeless dialog box", "A modal dialog box must be closed before the user can return to the parent window. For example, a login or confirmation dialog is usually modal. A modeless dialog box allows the user to continue working with other windows while it remains open. In Windows Forms, ShowDialog() opens a modal form, while Show() opens a modeless form."),
                ("vi. Functions for viewing data in ADO.NET", "ADO.NET provides several ways to view data. DataReader is used for fast, forward-only connected reading. DataSet stores disconnected data in memory. DataTable represents one table of records. DataView provides sorting, filtering, and searching over a DataTable. In UI applications, controls such as DataGridView or GridView display these records after binding."),
                ("vii. ASP.NET programming model", "ASP.NET uses an event-driven, server-side programming model. A web page contains server controls, and user actions such as button clicks are processed on the server. ASP.NET pages pass through a life cycle including request, initialization, loading, event handling, rendering, and unloading. Code-behind files separate logic from markup, making applications easier to maintain."),
                ("viii. AdRotator functions", "The AdRotator control in ASP.NET displays banner advertisements randomly or according to priority. It reads advertisement details from an XML file, including image URL, navigation URL, alternate text, keyword, and impression value. It helps rotate multiple advertisements on a page without manually changing image code each time."),
            ]),
            ("Question 2", [
                ("i. Client-side and Server-side Programming", "Client-side programming executes in the browser using HTML, CSS, JavaScript, and browser APIs. It improves responsiveness because small checks and interface updates do not need a server round trip. However, client-side code is visible to users and should not contain sensitive logic. Server-side programming executes on the web server using technologies such as ASP.NET, C#, ADO.NET, and web services. It is used for database access, authentication, authorization, business rules, and secure processing. In a good web application, client-side code improves user experience while server-side code protects correctness and security."),
                ("ii. Jagged Arrays", "A jagged array is an array of arrays where each row can have a different size. It is useful when data is irregular, such as students having different numbers of marks. Example: int[][] marks = new int[3][]; marks[0] = new int[] {80, 75}; marks[1] = new int[] {90, 85, 88}; marks[2] = new int[] {70}; The first index selects the row and the second index selects the value inside that row. Jagged arrays save memory compared with rectangular arrays when all rows do not need equal length."),
            ]),
            ("Question 3", [
                ("i. Loops, break and continue", "Looping statements repeat a block of code. C# supports for, while, do-while, and foreach loops. A for loop is suitable when the number of repetitions is known. A while loop is useful when repetition depends on a condition. A do-while loop executes at least once. A foreach loop is convenient for arrays and collections. The break statement immediately terminates the loop, while continue skips the current iteration and moves to the next iteration. These statements make loop control flexible, but they should be used carefully so that program flow remains readable."),
                ("ii. CLR functions", "CLR stands for Common Language Runtime. It is the execution engine of .NET. Its important functions include memory management through garbage collection, exception handling, type safety verification, thread management, security checking, JIT compilation, and interoperability support. CLR executes managed code and provides a controlled environment. Because of CLR, .NET programs are safer and easier to maintain than programs that require manual memory handling."),
            ], "dotnet_arch"),
            ("Question 4", [
                ("i. Sealed, virtual, abstract and readonly", "A sealed class cannot be inherited. It is used when the class design should not be extended. A virtual member allows derived classes to override its behavior. An abstract class cannot be instantiated and is used as a base class for common structure. An abstract method has no body and must be implemented by a derived class. A readonly field can be assigned at declaration or inside a constructor, but cannot be changed later. These keywords help control inheritance, modification, and object behavior."),
                ("ii. Overloaded constructors", "Constructor overloading means writing more than one constructor in the same class with different parameter lists. It allows objects to be initialized in different ways. A default constructor may assign standard values, while parameterized constructors assign values passed by the user. Constructors do not have return types and have the same name as the class. Constructor overloading improves flexibility and readability."),
            ]),
            ("Question 5", [
                ("i. Callback and delegates", "A callback is a technique where one method is passed as a reference and called later by another method. In C#, delegates provide a type-safe way to implement callbacks. A delegate defines the method signature. A method with the same signature is assigned to the delegate, and the delegate is invoked when required. This is useful in event handling, asynchronous programming, and plug-in style designs."),
                ("ii. Interfaces with inheritance", "An interface defines a contract of methods, properties, events, or indexers without complete implementation. A class implementing an interface must provide implementation for all members. C# does not support multiple inheritance of classes, but it supports implementing multiple interfaces. Interfaces are useful for achieving abstraction, loose coupling, and multiple inheritance of behavior contracts."),
            ], "delegate"),
            ("Question 6", [
                ("i. ADO.NET architecture", "ADO.NET architecture is divided into connected and disconnected parts. The connected part includes Connection, Command, and DataReader. Connection opens a link with the database. Command executes SQL queries or stored procedures. DataReader reads data quickly in forward-only mode. The disconnected part includes DataAdapter and DataSet. DataAdapter fills a DataSet and later updates database changes. DataSet stores tables, rows, columns, relations, and constraints in memory. This design supports scalability because database connections can be closed while the application works with cached data."),
                ("ii. User input validation", "User input validation checks whether data entered by the user is correct, complete, and meaningful. Validation protects the application from wrong values, incomplete forms, and security problems. In ASP.NET and Windows Forms, validation may include required field checking, range checking, comparison checking, regular expression checking, and custom validation. Both client-side and server-side validation are useful, but server-side validation is mandatory because client-side checks can be bypassed."),
            ], "adonet"),
            ("Question 7", [
                ("i. Customized dialog box", "A customized dialog box is a user-defined form designed for a specific purpose such as login, settings, search, or confirmation. In Windows Forms, a new form can be created, controls can be placed on it, and it can be opened using ShowDialog() for modal behavior. Properties can be used to pass values between the main form and dialog form. Custom dialogs improve usability because they match the exact requirement of the application."),
                ("ii. DataSet, DataTable and DataView", "A DataSet is an in-memory cache of data that can contain multiple DataTable objects. A DataTable represents one table with rows and columns. A DataView provides a customized view of a DataTable for sorting, filtering, and searching. DataRelation can connect tables inside the DataSet. Together these objects support disconnected database programming in ADO.NET."),
            ], "dataset"),
            ("Question 8", [
                ("i. Web server controls, list controls and validation controls", "Web server controls are ASP.NET controls that run on the server and render HTML to the browser. Examples include TextBox, Button, Label, DropDownList, GridView, and Calendar. List controls such as ListBox, DropDownList, CheckBoxList, and RadioButtonList display collections of items. Validation controls such as RequiredFieldValidator, RangeValidator, CompareValidator, RegularExpressionValidator, and CustomValidator check user input before processing."),
                ("ii. Authentication and authorization", "Authentication verifies the identity of a user, usually through username/password, Windows login, forms authentication, or token-based login. Authorization decides what an authenticated user is allowed to access. For example, a student may access profile pages, while an administrator may access management pages. Authentication answers 'Who are you?' and authorization answers 'What are you allowed to do?'"),
            ], "auth"),
            ("Question 9", [
                ("i. State management", "HTTP is stateless, so ASP.NET uses state management to remember data between requests. Client-side techniques include ViewState, cookies, hidden fields, and query strings. Server-side techniques include Session, Application, Cache, and database storage. ViewState stores page control values, cookies store small client-side data, Session stores user-specific server-side data, and Cache stores frequently used data for performance."),
                ("ii. Data-bound and data source controls", "Data source controls connect ASP.NET pages to data sources, while data-bound controls display that data. SqlDataSource can execute SQL queries, ObjectDataSource can call business objects, and XmlDataSource can provide XML data. GridView, DetailsView, FormView, DataList, Repeater, DropDownList, and ListBox can bind to these sources. This reduces manual coding and supports display, selection, sorting, paging, and editing."),
            ], "databinding"),
        ],
    },
    {
        "title": "PDF 2 - Web Development Using .NET Framework",
        "subtitle": "December 2024 Answers",
        "questions": [
            ("Question 1", [
                ("i. Interoperability in .NET", "Interoperability means the ability of different systems, languages, and components to work together. .NET achieves interoperability through CLR, CLS, CTS, metadata, assemblies, XML web services, COM interoperability, and platform-standard data exchange formats. A component written in one .NET language can be consumed by another language because all are compiled into MSIL and executed by CLR."),
                ("ii. C# as a free-form language", "C# is called a free-form language because spaces, tabs, and line breaks are mostly ignored by the compiler except inside strings and tokens. Statements are terminated by semicolons and blocks are identified using braces. This allows programmers to format code in a readable style without changing meaning."),
                ("iii. Class-level and instance-level variables", "Class-level variables belong to the class and are usually declared static. They are shared by all objects. Instance-level variables belong to individual objects, so each object gets its own copy. Static fields are useful for common counters or shared settings, while instance fields represent object-specific state."),
                ("iv. Overriding methods", "Method overriding means redefining a base class virtual method in a derived class using override. It supports runtime polymorphism. The base method must be virtual, abstract, or override. The derived method must have the same signature."),
                ("v. IDE components for Windows applications", "Two common Visual Studio IDE components are Toolbox and Properties Window. The Toolbox contains controls such as Button, Label, TextBox, ComboBox, and DataGridView. The Properties Window allows changing name, text, size, color, font, events, and layout of selected controls."),
                ("vi. Dataset methods in ADO.NET", "Important DataSet methods include ReadXml(), WriteXml(), AcceptChanges(), RejectChanges(), Clear(), and GetChanges(). ReadXml loads XML data into a dataset. WriteXml saves dataset data as XML. AcceptChanges confirms changes, while RejectChanges cancels pending changes."),
                ("vii. Dynamic compilation of ASP.NET pages", "ASP.NET pages are dynamically compiled when first requested or when source files change. ASP.NET converts markup and code-behind into a class, compiles it into an assembly, and executes it. Later requests use the compiled version until a change occurs."),
                ("viii. Hierarchical data-bound controls", "Hierarchical data-bound controls display tree-like data. TreeView and Menu are common examples. They can bind to XML, sitemap data, or hierarchical collections. They are useful for navigation menus, category structures, and organizational trees."),
            ]),
            ("Question 2", [
                ("i. Four services of Framework Base Classes", "Framework Base Classes provide ready-made services for common programming tasks. Important services include file input/output through System.IO, collection handling through System.Collections, database access through System.Data, and web programming through System.Web. Other services include networking, XML handling, threading, security, diagnostics, and globalization."),
                ("ii. Enumeration in C#", "An enumeration is a value type that defines a group of named constants. It improves readability by replacing magic numbers with meaningful names. Example: enum WeekDay { Monday, Tuesday, Wednesday }. Two enum values here are Monday and Tuesday. Enums are useful for status, roles, categories, and fixed option sets."),
            ]),
            ("Question 3", [
                ("i. Execution model and components for .NET web applications", "A .NET web application runs through browser request, IIS, ASP.NET runtime, page compilation, CLR execution, and HTML response. The browser sends an HTTP request. IIS receives it and forwards it to ASP.NET. ASP.NET creates the page object, restores state, handles events, executes code, renders HTML, and sends output to the browser. CLR manages code execution and FCL provides required classes."),
                ("ii. StringBuilder, verbatim string and immutable strings", "A string in C# is immutable, meaning once created its content cannot be changed. Every modification creates a new string object. StringBuilder is used when frequent modifications are required, because it modifies text in a buffer. A verbatim string begins with @ and treats backslashes literally, useful for file paths and multi-line text. Example: string path = @\"C:\\Data\\file.txt\";"),
            ], "dotnet_arch"),
            ("Question 4", [
                ("i. Overloaded constructors", "Overloaded constructors are multiple constructors in the same class with different parameter lists. They help initialize objects in different ways. Rules include same class name, no return type, different parameter count/type/order, and optional constructor chaining using this(). Default, parameterized, copy-style, static, and private constructors are common forms in C# design."),
                ("ii. Multiple inheritance and constructor order", "C# does not support multiple inheritance of classes because it can create ambiguity, but a class can implement multiple interfaces. In inheritance, constructors execute from base class to derived class. If class C derives from B and B derives from A, then A constructor executes first, then B, then C. This ensures base members are initialized before derived members use them."),
            ], "inheritance"),
            ("Question 5", [
                ("i. Sealed concept at class and method levels", "A sealed class cannot be inherited. It is useful when a class is complete, security-sensitive, or should not be extended. A sealed method is used with override to stop further overriding in derived classes. This gives the programmer control over inheritance and protects behavior from unwanted modification."),
                ("ii. Interfaces and multiple inheritance", "Interfaces allow a class to follow multiple contracts. A class can implement several interfaces, such as IPrintable and ISavable. Each interface declares required members, and the class provides implementation. This solves the need for multiple inheritance without inheriting implementation from many base classes."),
            ]),
            ("Question 6", [
                ("i. Windows Forms and standard controls", "Windows Forms is a .NET technology for creating desktop GUI applications. A form acts as a window. Standard controls include Label, TextBox, Button, RadioButton, CheckBox, ComboBox, ListBox, PictureBox, DataGridView, MenuStrip, and Panel. Each control has properties, methods, and events."),
                ("ii. Input validation in Windows applications", "Input validation ensures that user-entered data is correct before saving or processing. It may check required fields, numeric range, date format, email format, password rules, and duplicate data. Windows Forms supports validation events, ErrorProvider control, and manual validation in button-click events. Validation improves data quality and prevents runtime errors."),
            ]),
            ("Question 7", [
                ("i. Dataset object model and functionality", "The DataSet object model contains DataSet, DataTable, DataColumn, DataRow, Constraint, DataRelation, and DataView. A DataSet may contain multiple tables. Tables contain columns and rows. Relations connect tables. Constraints protect rules. DataView provides sorting and filtering. The DataSet works disconnected from the database, which improves scalability."),
                ("ii. Navigation between data records", "Navigation means moving among records displayed in bound controls. In Windows Forms this is usually done using BindingSource or CurrencyManager. Methods such as MoveFirst(), MovePrevious(), MoveNext(), and MoveLast() change current record position. Bound text boxes and grids automatically display the current record."),
            ], "dataset"),
            ("Question 8", [
                ("i. ASP.NET page rendering phase and page life cycle", "ASP.NET page life cycle includes request, start, initialization, load, postback event handling, pre-render, render, and unload. During rendering, server controls generate HTML output. This HTML is sent to the browser. Rendering is important because server controls do not directly appear in the browser; they produce browser-compatible markup."),
                ("ii. Authorization and authentication", "Authentication verifies the user identity. Authorization checks permissions after identity is known. ASP.NET supports forms authentication, Windows authentication, role-based authorization, URL authorization, and custom authorization. A secure application uses both: first login verification, then role or policy checking for resources."),
            ], "page_lifecycle"),
            ("Question 9", [
                ("i. Data Source and GridView controls", "A data source control such as SqlDataSource connects to a database and executes queries. GridView displays data in rows and columns. GridView supports paging, sorting, selection, editing, and deleting. It can bind directly using DataSourceID or programmatically using DataSource and DataBind()."),
                ("ii. Web services, components and functions in ASP.NET", "A web service exposes application functionality over the network. Its components include service class, methods, hosting environment, protocol, request/response format, and service description. In ASP.NET, web services help share business logic, integrate applications, and provide reusable operations to clients built on different platforms."),
            ], "webservice"),
        ],
    },
    {
        "title": "PDF 3 - Web Development Using .NET Framework",
        "subtitle": "December 2025 Re-appear Answers",
        "questions": [
            ("Question 1", [
                ("a. Two characteristics of server-side programming", "Server-side programming executes main logic on the server. It is secure because database operations, authentication, authorization, and business rules are not exposed directly to the browser. It also generates dynamic output according to user request, database values, session data, and application conditions. Server-side programming is browser-independent and can centralize application control."),
                ("b. Major .NET components for web services", "Important components are CLR, Framework Class Library, ASP.NET, ADO.NET, XML/SOAP/WSDL support, IIS, assemblies, and metadata. CLR executes managed code. FCL provides ready-made classes. ASP.NET builds and hosts services. ADO.NET connects to databases. XML, SOAP, WSDL, JSON, and HTTP help communication with outside applications."),
                ("c. Read-only property in C#", "A read-only property allows outside code to read a value but not directly modify it. It usually has only a get accessor or a private set accessor. It protects data and supports encapsulation. Example: public int RollNo { get; } or public int Age { get { return age; } }."),
                ("d. Modifiers applied to a delegate", "Delegates can use access modifiers such as public, private, protected, internal, and protected internal depending on where they are declared. These modifiers control visibility. A delegate defines the signature of methods it can refer to and is used for callbacks and events."),
                ("e. Four characteristics of ListBox", "ListBox displays a list of items, stores items in the Items collection, supports single or multiple selection, provides SelectedIndex and SelectedItem properties, supports scrolling, can be data-bound, and raises events such as SelectedIndexChanged."),
                ("f. Data cached in DataSet", "A DataSet stores data in memory after DataAdapter.Fill() is called. The database connection can be closed after filling. Data is kept as DataTable, DataRow, DataColumn, DataRelation, and Constraint objects. Changes can be made offline and later updated to the database."),
                ("g. Web services integration", "Web services provide integration through standard protocols such as HTTP, SOAP, REST, XML, and JSON. Different applications can communicate even if they use different languages or platforms. Web services support loose coupling, reusable business logic, and interoperability."),
                ("h. PostBack concept", "PostBack means an ASP.NET page sends itself back to the server for processing. Button clicks, list selections, and form submissions can cause postback. The IsPostBack property checks whether the page is loading first time or after a user action."),
            ]),
            ("Question 2", [
                ("a. Component Model and three generations", "A component model allows software to be built from reusable independent components with well-defined interfaces. The first generation was COM, which supported reusable binary components and language independence but suffered from registry dependency, version conflicts, and DLL Hell. The second generation was COM+, which added transactions, object pooling, role-based security, and distributed services but remained complex and Windows-oriented. The third generation is the .NET component model, where components are packaged as assemblies with metadata, version information, and managed execution. .NET reduces deployment problems and improves language integration through CLR."),
                ("b. Role of MSIL in web services", "MSIL is the intermediate code generated after compiling C#, VB.NET, or another .NET language. In web services, MSIL allows language independence, common execution under CLR, metadata-based description, type safety, verification, and JIT compilation. A web service assembly contains MSIL and metadata. When the service is requested, CLR verifies the code and JIT compiles required methods into native code."),
            ], "component_model"),
            ("Question 3", [
                ("a. C# concepts", "Implicit conversion is automatic conversion where no data loss occurs, such as int to double. Explicit conversion is required where data loss may happen, such as double to int. Casting is the act of converting one type to another using cast syntax or Convert methods. Value data types store actual values, such as int, char, bool, float, double, decimal, struct, and enum. Operator precedence decides expression evaluation order; multiplication occurs before addition unless parentheses change the order."),
                ("b. Variable-sized arrays", "Variable-sized arrays in C# are commonly implemented as jagged arrays. A jagged array is an array of arrays where each row may have a different length. Example: int[][] marks = new int[3][]; marks[0] = new int[] {80,75}; marks[1] = new int[] {90,85,88}; marks[2] = new int[] {70}; It saves memory for irregular data and is accessed using two indexes such as marks[1][2]."),
            ]),
            ("Question 4", [
                ("a. Four pillars of OOP", "Encapsulation binds data and methods inside a class and protects data using access modifiers. Abstraction shows essential features and hides implementation details through abstract classes and interfaces. Inheritance allows a derived class to reuse base class members. Polymorphism allows one name to behave in many forms through overloading and overriding. These pillars make software reusable, maintainable, and closer to real-world modeling."),
                ("b. Constructor and constructor overloading", "A constructor is a special method called automatically when an object is created. It has the same name as the class and no return type. Constructor overloading means defining multiple constructors with different parameter lists. It allows default initialization, partial initialization, and full initialization of objects depending on available data."),
            ], "oop"),
            ("Question 5", [
                ("a. Multilevel and hierarchical inheritance", "In multilevel inheritance, a class derives from another derived class, forming a chain such as Animal -> Dog -> Puppy. In hierarchical inheritance, multiple classes derive from one base class, such as Circle and Rectangle deriving from Shape. Multilevel inheritance represents step-by-step specialization, while hierarchical inheritance represents common features shared by several child classes."),
                ("b. Class visibility and abstract classes", "Class visibility controls where a class can be accessed. Public classes are accessible widely, internal classes are accessible in the same assembly, and nested classes may use private or protected visibility. An abstract class cannot be instantiated. It can contain abstract methods without body and normal methods with body. Derived classes must implement abstract members. Abstract classes are useful when common structure is known but complete behavior is supplied by derived classes."),
            ], "inheritance"),
            ("Question 6", [
                ("a. ADO.NET object model", "ADO.NET contains Connection, Command, DataReader, DataAdapter, DataSet, DataTable, DataRelation, and DataView. Connection opens communication with a data source. Command executes SQL. DataReader provides connected forward-only reading. DataAdapter fills a DataSet and updates changes. DataSet stores disconnected data. DataTable stores records, DataRelation connects tables, and DataView supports filtering and sorting."),
                ("b. Typed and untyped datasets", "A typed dataset is generated from a schema and provides strongly typed access such as ds.Students[0].Name. It gives compile-time checking and IntelliSense. An untyped dataset uses string-based access such as ds.Tables['Students'].Rows[0]['Name']. It is flexible but errors may appear at runtime. Typed datasets are better for fixed schemas, while untyped datasets are useful when the structure is dynamic."),
            ], "adonet"),
            ("Question 7", [
                ("a. CurrencyManager and filters", "CurrencyManager manages the current position of data in a bound list. When a DataView is filtered using RowFilter, CurrencyManager synchronizes bound controls with the filtered record set. It maintains current record position, supports navigation, and keeps multiple controls showing values from the same current row. In modern code, BindingSource often wraps CurrencyManager behavior."),
                ("b. Steps to connect controls and datasets", "First create a database connection. Second create a DataAdapter with a query. Third create and fill a DataSet. Fourth bind controls to dataset tables and columns. Fifth use BindingSource or CurrencyManager for navigation. Sixth display records in controls such as TextBox or DataGridView. Seventh use DataAdapter.Update() with proper commands to save changes."),
            ]),
            ("Question 8", [
                ("a. Breakpoints and Class View", "Breakpoints pause execution at selected lines so variable values, object states, and control flow can be inspected. Conditional breakpoints stop only when a condition is true. Step Into, Step Over, and Step Out help trace execution. Class View displays namespaces, classes, methods, properties, events, and inheritance structure. It helps navigate large projects and understand program organization."),
                ("b. Cookies and session state", "Cookies are client-side state management. They store small data in the browser and are sent with requests. They are useful for preferences but should not store sensitive plain text. Session state is server-side. It stores user-specific data on the server and identifies users through a session ID. Session is safer for login and temporary user data but consumes server memory."),
            ], "state"),
            ("Question 9", [
                ("a. Validation controls", "RequiredFieldValidator checks that a field is not empty. RangeValidator checks that a value lies within a specified range. ASP.NET also provides CompareValidator, RegularExpressionValidator, CustomValidator, and ValidationSummary. In button-click code, Page.IsValid confirms that all validators have passed before saving data."),
                ("b. Data-bound and data source controls", "Data source controls such as SqlDataSource connect to databases and execute commands. Data-bound controls such as GridView, DetailsView, FormView, DataList, Repeater, DropDownList, and ListBox display the retrieved data. The control can bind declaratively through DataSourceID or programmatically using DataSource and DataBind()."),
            ], "databinding"),
        ],
    },
    {
        "title": "PDF 4 - Web Development Using .NET Framework",
        "subtitle": "May 2025 Answers",
        "questions": [
            ("Question 1", [
                ("i. Monolithic assemblies", "A monolithic assembly contains all required types and resources of an application or component in a single assembly file. It is simple to deploy because fewer files are involved. However, large monolithic assemblies can become harder to maintain and update compared with modular assemblies."),
                ("ii. Origins of .NET technology", ".NET developed from Microsoft’s need for a managed, language-independent, internet-ready development platform. Earlier technologies such as COM, COM+, ASP, and Visual Basic had limitations in deployment, versioning, and interoperability. .NET introduced CLR, MSIL, assemblies, metadata, FCL, ASP.NET, ADO.NET, and managed code."),
                ("iii. Delegate modifiers", "Delegates commonly use access modifiers such as public, private, protected, internal, and protected internal. These decide where the delegate type can be accessed. Delegates are used for callbacks, events, and flexible method invocation."),
                ("iv. Operators that cannot be overloaded", "Some C# operators cannot be overloaded, including =, &&, ||, ?:, new, typeof, sizeof, is, as, and member access operators such as . . Assignment and conditional logic operators are controlled by the language and cannot be redefined by classes."),
                ("v. ListBox and ComboBox", "ListBox displays a visible list of items and can allow multiple selection. ComboBox combines a text box with a drop-down list and usually saves space on the form. ListBox is better when users need to see many options at once, while ComboBox is better when space is limited."),
                ("vi. ADO.NET scalability", "ADO.NET supports scalability through disconnected data access. A DataSet can be filled and the connection can be closed quickly. Connection pooling reuses database connections. DataReader provides fast connected reading when needed. These features reduce database load and improve performance for many users."),
                ("vii. PostBack", "PostBack means sending the current ASP.NET page back to the server for event processing. It is used by server controls such as Button, DropDownList, and CheckBox. IsPostBack helps separate first-time loading code from repeated postback code."),
                ("viii. Debugging in .NET", "Debugging in .NET is done using Visual Studio tools such as breakpoints, watch window, locals window, call stack, immediate window, exception settings, and step commands. Debugging helps find runtime errors, wrong values, logical mistakes, and flow problems."),
            ]),
            ("Question 2", [
                ("i. Major components of .NET Framework", "The .NET Framework includes language compilers, MSIL, assemblies, metadata, CLR, CTS, CLS, FCL, ASP.NET, ADO.NET, Windows Forms, and IIS integration. Source code is compiled into MSIL. CLR verifies and executes code. FCL provides reusable classes. ASP.NET supports web applications, ADO.NET supports data access, and Windows Forms supports desktop GUI."),
                ("ii. Managed code as a wonder", "Managed code runs under CLR supervision. CLR provides garbage collection, type safety, exception handling, security checks, threading, JIT compilation, and version management. Programmers do not need to manually free memory. Managed execution reduces many common errors and makes applications more reliable."),
            ], "dotnet_arch"),
            ("Question 3", [
                ("i. Mixed-mode arithmetic expression", "Mixed-mode arithmetic uses more than one numeric type in the same expression, such as int, float, double, and decimal. C# applies type promotion before calculation. Smaller compatible types are converted to larger types to avoid data loss. Example: int a = 5; double b = 2.5; double c = a + b; Here a is converted to double before addition."),
                ("ii. break, continue, label, foreach and boxing", "break terminates a loop or switch. continue skips the current loop iteration. A label marks a statement and can be used with goto, though it should be used carefully. foreach iterates through arrays and collections. Boxing converts a value type into object, such as object o = 10. Unboxing converts it back, such as int x = (int)o. Boxing is useful but excessive boxing can affect performance."),
            ]),
            ("Question 4", [
                ("i. Preventing inheritance using sealed classes and methods", "A sealed class cannot be used as a base class. Example: sealed class SecurityManager { }. This is useful for classes that must not be modified through inheritance. A sealed method prevents further overriding of an overridden method. Example: public sealed override void Display(). It protects behavior in deeper derived classes."),
                ("ii. Interfaces and classes", "An interface defines a contract, while a class provides implementation. Interfaces cannot contain instance fields and cannot be directly instantiated. A class can inherit from one class but implement multiple interfaces. Interfaces support abstraction and loose coupling. Classes represent complete or partial implementation with constructors, fields, methods, and properties."),
            ]),
            ("Question 5", [
                ("i. Binary operator overloading", "Binary operators work on two operands. In C#, a class can overload operators such as +, -, *, /, ==, and != using the operator keyword. At least one operand must be the containing type. Example: public static Complex operator +(Complex a, Complex b) { return new Complex(a.Real + b.Real, a.Imag + b.Imag); }. Operator overloading should be used only when the meaning is natural."),
                ("ii. Delegate declaration, initialization and invocation", "A delegate is a type-safe reference to a method. Declaration defines the signature: public delegate void MyDel(string msg); Initialization assigns a method: MyDel d = Show; Invocation calls the method through delegate: d('Hello'); Delegates give power to programmers by supporting callbacks, event handling, multicast invocation, and flexible method passing."),
            ], "delegate"),
            ("Question 6", [
                ("i. DataSet model with DataRelation, DataTable and DataView", "A DataSet is a disconnected in-memory representation of data. It contains DataTable objects. A DataTable contains DataColumn and DataRow objects. DataRelation defines parent-child relation between tables, such as Department and Employee. DataView provides sorted and filtered views of a DataTable. This model allows rich offline manipulation of relational data."),
                ("ii. Data binding and navigation", "Data binding connects controls to data sources so controls display and update data automatically. Navigation allows movement among records using BindingSource or CurrencyManager. MoveFirst, MovePrevious, MoveNext, and MoveLast change the current record. Bound controls update automatically according to current position."),
            ], "dataset"),
            ("Question 7", [
                ("i. Displaying data through DataViews", "A DataView provides customized display of a DataTable. It can sort rows using Sort, filter rows using RowFilter, and search rows. Example: DataView dv = new DataView(table); dv.RowFilter = 'City = Delhi'; dv.Sort = 'Name ASC'; A DataGridView can bind to the DataView to show only filtered and sorted records."),
                ("ii. Windows Form, BindingContext and CurrencyManager", "A Windows Form contains bound controls. BindingContext manages binding managers for data sources on the form. CurrencyManager controls the current position for a list-based data source. When the current position changes, all controls bound to the same source display the corresponding record. This makes record navigation consistent across text boxes, combo boxes, and grids."),
            ]),
            ("Question 8", [
                ("i. Web server control, List control and validation controls", "A web server control runs on the server and renders HTML to the browser. List controls include DropDownList, ListBox, CheckBoxList, and RadioButtonList. They display collections of values. Validation controls check user input. RequiredFieldValidator checks empty input, RangeValidator checks range, CompareValidator compares values, and RegularExpressionValidator checks pattern."),
                ("ii. Authorization methods in .NET", "Two common authorization methods are URL authorization and role-based authorization. URL authorization restricts access to pages or folders through configuration rules. Role-based authorization checks whether the authenticated user belongs to a role such as Admin, Student, or Manager. Authorization can also be handled through custom code and policies."),
            ], "auth"),
            ("Question 9", [
                ("i. Caching as state management", "Caching stores frequently used data temporarily so repeated requests can be served faster. In ASP.NET, cache may store application data, page output, or user-specific values. It improves performance, reduces database calls, and lowers server processing. Cache is considered part of state management because it preserves useful data across requests for a defined duration."),
                ("ii. Displaying data using data-bound controls", "Data can be displayed using GridView for tabular records, DetailsView for one record at a time, FormView for template-based display, Repeater for custom layout, and DropDownList for selections. Data can be bound through SqlDataSource declaratively or through C# code using DataTable and DataBind()."),
            ], "databinding"),
        ],
    },
    {
        "title": "PDF 5 - Web Development Using .NET Framework",
        "subtitle": "July 2022 Answers",
        "questions": [
            ("Question 1", [
                ("a. IL and cross-language integration", "Intermediate Language provides cross-language integration because all .NET language compilers generate MSIL. A C# class and a VB.NET class can interact because both are represented through MSIL, metadata, CTS, and CLR. This common representation supports language independence and component reuse."),
                ("b. StringBuilder class", "StringBuilder is used for efficient string modification. Since string objects are immutable, repeated concatenation creates many objects. StringBuilder maintains a mutable buffer, making append, insert, replace, and remove operations faster for repeated text changes."),
                ("c. Four method modifiers", "Common method modifiers include public, private, protected, internal, static, virtual, override, abstract, sealed, and extern. Access modifiers control visibility, while behavior modifiers control inheritance and execution behavior."),
                ("d. Error and exception", "An error is generally a serious problem that may not be recoverable, such as system failure. An exception is an abnormal condition during program execution that can be handled using try, catch, finally, and throw. Example: dividing by zero raises DivideByZeroException."),
                ("e. Adding a new form object", "In Visual Studio, right-click the project, choose Add, select Windows Form, give a form name, and click Add. The form appears in Solution Explorer and can be opened in Designer. It can be shown using Form2 f = new Form2(); f.Show(); or f.ShowDialog();."),
                ("f. Properties of RadioButton and RichTextBox", "RadioButton properties include Checked, Text, GroupName or container grouping, Enabled, and AutoCheck. RichTextBox properties include Text, Rtf, SelectionFont, SelectionColor, ReadOnly, and Multiline."),
                ("g. ASP.NET framework components", "ASP.NET includes page framework, server controls, validation controls, state management, caching, authentication, authorization, configuration system, web services, master pages, themes, and data controls. These components help build dynamic web applications."),
                ("h. Data binding importance", "Data binding connects UI controls with data sources. It reduces manual code, keeps display synchronized with data, supports editing and navigation, and makes applications easier to maintain. ASP.NET and Windows Forms both use data binding heavily."),
            ]),
            ("Question 2", [
                ("i. Managed and unmanaged code", "Managed code runs under CLR supervision and receives services such as garbage collection, type safety, exception handling, and security. Unmanaged code runs directly under the operating system without CLR control, such as traditional C/C++ components. Metadata is used in .NET assemblies to describe types, members, references, and version information. Interoperability services help managed code call unmanaged code when needed."),
                ("ii. JIT compiler working", "JIT means Just-In-Time compiler. It converts MSIL into native machine code at runtime. Source code is compiled into MSIL and metadata. When a method is called, CLR verifies the MSIL and JIT compiles that method into machine code. The compiled code is reused during execution. JIT improves portability because MSIL can run on different machines with suitable CLR."),
            ], "jit_flow"),
            ("Question 3", [
                ("i. Literals and C# data types", "A literal is a fixed value written directly in code. Types include integer literals, floating-point literals, character literals, string literals, boolean literals, and null literal. C# data types are mainly value types and reference types. Value types include numeric types, bool, char, struct, and enum. Reference types include class, object, string, array, interface, and delegate."),
                ("ii. Fall-through and foreach", "C# does not allow automatic fall-through from one non-empty switch case to the next. Each case must end with break, goto, return, or throw. This prevents accidental execution. foreach is used to iterate through arrays and collections without manually managing indexes. Example: foreach(int x in numbers) { Console.WriteLine(x); }."),
            ]),
            ("Question 4", [
                ("i. Standard inheritance and containment inheritance", "Standard inheritance represents an 'is-a' relationship. Example: Car is a Vehicle, so class Car can inherit Vehicle. Containment represents a 'has-a' relationship. Example: Car has an Engine, so Car contains an Engine object. Inheritance reuses base class behavior, while containment builds a class by using objects of other classes as members."),
                ("ii. Inclusion polymorphism", "Inclusion polymorphism is achieved when a base class reference refers to derived class objects and overridden methods are called at runtime. In C#, this uses virtual and override. Example: Shape s = new Circle(); s.Draw(); calls Circle's Draw method. It supports flexible code, extensibility, and runtime decision-making."),
            ], "inheritance"),
            ("Question 5", [
                ("i. Interface instantiation", "An interface cannot be instantiated because it does not provide complete implementation and has no object state like a normal class. The solution is to create a class that implements the interface and then instantiate that class. Example: IPrintable p = new Report(); Here Report implements IPrintable."),
                ("ii. Delegates and four steps", "A delegate is a type-safe method reference. Four steps are: declare the delegate, define a method with matching signature, create delegate object by assigning the method, and invoke the delegate. Delegates are useful for callbacks, events, and passing behavior as data."),
            ], "delegate"),
            ("Question 6", [
                ("i. ErrorProvider control", "ErrorProvider is a Windows Forms control used to show validation errors beside input controls. It displays an error icon and message when input is invalid. Example: if txtName.Text == '' then errorProvider1.SetError(txtName, 'Name required'); else errorProvider1.SetError(txtName, '');. It improves user feedback without showing repeated message boxes."),
                ("ii. Windows Form life cycle", "The Windows Form life cycle includes constructor, initialization, Load event, Shown event, Activated event, user interaction events, FormClosing event, FormClosed event, and Dispose. Constructor creates the form object. Load prepares data. Shown appears when the form is first displayed. FormClosing allows cancellation. FormClosed runs after closing. Dispose releases resources."),
            ], "win_lifecycle"),
            ("Question 7", [
                ("i. Connected and disconnected approach", "The connected approach keeps the database connection open while data is read, usually with DataReader. It is fast and memory-efficient but requires an active connection. The disconnected approach uses DataAdapter and DataSet. Data is loaded into memory, the connection is closed, and work continues offline. It is better for scalable applications and data binding."),
                ("ii. CRUD operations with ADO.NET", "CRUD means Create, Read, Update, and Delete. Steps include creating connection, creating command or data adapter, opening connection if needed, executing SQL, handling parameters, reading results, and closing connection. Create uses INSERT, Read uses SELECT, Update uses UPDATE, and Delete uses DELETE. Parameterized queries should be used to prevent SQL injection."),
            ], "adonet"),
            ("Question 8", [
                ("i. ASP.NET application and page life cycle", "Application life cycle relates to the whole web application and includes Application_Start, Session_Start, Application_BeginRequest, Application_Error, Session_End, and Application_End. Page life cycle relates to one page request and includes request, start, init, load, postback events, pre-render, render, and unload. Application life cycle manages global events, while page life cycle manages page processing."),
                ("ii. Authentication and authorization", "Authentication can be achieved through Forms Authentication, Windows Authentication, or custom login. Authorization can be achieved through roles, configuration rules, URL authorization, and code checks. A typical flow is login, identity creation, role assignment, and access checking before protected pages are displayed."),
            ], "page_lifecycle"),
            ("Question 9", [
                ("i. Session in ASP.NET", "A session is a server-side storage area for one user's data during a visit. ASP.NET creates a unique session ID for each user. Data is stored using Session['key'] = value and read using Session['key']. Sessions are used for login information, shopping carts, temporary selections, and user-specific state. Sessions end on timeout, abandonment, or application restart depending on mode."),
                ("ii. Validations, RangeValidator and CompareValidator", "Validation is important because it prevents incomplete, wrong, and unsafe data from being processed. RangeValidator checks whether a value lies between minimum and maximum values. CompareValidator compares one input with another value or control, such as password confirmation or date comparison. Validation improves data quality and user experience."),
            ], "state"),
        ],
    },
]


QUESTION_TEXT = {
    # PDF 1
    (0, "Question 1", "i. VOS"): "What is VOS?",
    (0, "Question 1", "ii. Four inbuilt libraries"): "Write any four inbuilt libraries of .NET Framework.",
    (0, "Question 1", "iii. C# as true object-oriented language"): "How is C# a true object-oriented programming language?",
    (0, "Question 1", "iv. One type of inheritance"): "Explain any one type of inheritance supported in C#.",
    (0, "Question 1", "v. Modal and modeless dialog box"): "Differentiate between modal and modeless dialog boxes.",
    (0, "Question 1", "vi. Functions for viewing data in ADO.NET"): "Write the functions or objects used for viewing data in ADO.NET.",
    (0, "Question 1", "vii. ASP.NET programming model"): "Explain the ASP.NET programming model.",
    (0, "Question 1", "viii. AdRotator functions"): "Write the functions of AdRotator control in ASP.NET.",
    (0, "Question 2", "i. Client-side and Server-side Programming"): "Differentiate between client-side and server-side programming.",
    (0, "Question 2", "ii. Jagged Arrays"): "Explain jagged arrays in C# with example.",
    (0, "Question 3", "i. Loops, break and continue"): "Explain looping statements and the use of break and continue in C#.",
    (0, "Question 3", "ii. CLR functions"): "Explain the important functions of CLR.",
    (0, "Question 4", "i. Sealed, virtual, abstract and readonly"): "Explain sealed class, virtual member, abstract class and readonly keyword.",
    (0, "Question 4", "ii. Overloaded constructors"): "Explain overloaded constructors in C#.",
    (0, "Question 5", "i. Callback and delegates"): "Explain callback mechanism and delegates in C#.",
    (0, "Question 5", "ii. Interfaces with inheritance"): "Explain interfaces and how they support inheritance in C#.",
    (0, "Question 6", "i. ADO.NET architecture"): "Explain ADO.NET architecture with diagram.",
    (0, "Question 6", "ii. User input validation"): "Explain user input validation in .NET applications.",
    (0, "Question 7", "i. Customized dialog box"): "Explain customized dialog box in Windows Forms.",
    (0, "Question 7", "ii. DataSet, DataTable and DataView"): "Explain DataSet, DataTable and DataView in ADO.NET.",
    (0, "Question 8", "i. Web server controls, list controls and validation controls"): "Explain web server controls, list controls and validation controls in ASP.NET.",
    (0, "Question 8", "ii. Authentication and authorization"): "Differentiate between authentication and authorization.",
    (0, "Question 9", "i. State management"): "Explain state management in ASP.NET.",
    (0, "Question 9", "ii. Data-bound and data source controls"): "Explain data-bound controls and data source controls in ASP.NET.",

    # PDF 2
    (1, "Question 1", "i. Interoperability in .NET"): "What is interoperability and how is it achieved in .NET?",
    (1, "Question 1", "ii. C# as a free-form language"): "Why is C# called a free-form language?",
    (1, "Question 1", "iii. Class-level and instance-level variables"): "Differentiate between class-level and instance-level variables.",
    (1, "Question 1", "iv. Overriding methods"): "What is method overriding in C#?",
    (1, "Question 1", "v. IDE components for Windows applications"): "Write any two IDE components used for developing Windows applications.",
    (1, "Question 1", "vi. Dataset methods in ADO.NET"): "Write any two methods associated with DataSet class in ADO.NET.",
    (1, "Question 1", "vii. Dynamic compilation of ASP.NET pages"): "Explain dynamic compilation of pages by ASP.NET.",
    (1, "Question 1", "viii. Hierarchical data-bound controls"): "What are hierarchical data-bound controls in ASP.NET?",
    (1, "Question 2", "i. Four services of Framework Base Classes"): "Write any four services provided by Framework Base Classes.",
    (1, "Question 2", "ii. Enumeration in C#"): "What is enumeration in C# and why is it useful? Write two enum values.",
    (1, "Question 3", "i. Execution model and components for .NET web applications"): "Explain execution model and major components of .NET for web applications.",
    (1, "Question 3", "ii. StringBuilder, verbatim string and immutable strings"): "Explain StringBuilder, verbatim string and immutable strings in C#.",
    (1, "Question 4", "i. Overloaded constructors"): "Explain overloaded constructors, their rules and types.",
    (1, "Question 4", "ii. Multiple inheritance and constructor order"): "Explain multiple inheritance and constructor execution order in C#.",
    (1, "Question 5", "i. Sealed concept at class and method levels"): "Explain sealed concept at class level and method level.",
    (1, "Question 5", "ii. Interfaces and multiple inheritance"): "Explain how interfaces implement multiple inheritance in C#.",
    (1, "Question 6", "i. Windows Forms and standard controls"): "Explain Windows Forms and standard controls.",
    (1, "Question 6", "ii. Input validation in Windows applications"): "Explain input validation in Windows applications.",
    (1, "Question 7", "i. Dataset object model and functionality"): "Explain DataSet object model and its functionality.",
    (1, "Question 7", "ii. Navigation between data records"): "Explain navigation between data records in ADO.NET.",
    (1, "Question 8", "i. ASP.NET page rendering phase and page life cycle"): "Explain ASP.NET page rendering phase and page life cycle.",
    (1, "Question 8", "ii. Authorization and authentication"): "Differentiate between authorization and authentication in ASP.NET.",
    (1, "Question 9", "i. Data Source and GridView controls"): "Explain Data Source and GridView controls.",
    (1, "Question 9", "ii. Web services, components and functions in ASP.NET"): "Explain web services, their components and functions in ASP.NET.",

    # PDF 3
    (2, "Question 1", "a. Two characteristics of server-side programming"): "Write down any two characteristics of server-side programming.",
    (2, "Question 1", "b. Major .NET components for web services"): "Brief the major components of Microsoft .NET Framework required for developing web services.",
    (2, "Question 1", "c. Read-only property in C#"): "What is a read-only property used in C# language?",
    (2, "Question 1", "d. Modifiers applied to a delegate"): "What are the modifiers that can be applied to a delegate?",
    (2, "Question 1", "e. Four characteristics of ListBox"): "Write down any four characteristics of ListBox used as a standard control.",
    (2, "Question 1", "f. Data cached in DataSet"): "Brief out how data is cached in datasets in ADO.NET.",
    (2, "Question 1", "g. Web services integration"): "How do web services provide easy integration between different applications?",
    (2, "Question 1", "h. PostBack concept"): "Define PostBack concept available in ASP.NET Framework.",
    (2, "Question 2", "a. Component Model and three generations"): "Define Component Model. Explain all three generations of Component Model in terms of their characteristics and challenges.",
    (2, "Question 2", "b. Role of MSIL in web services"): "What important role does Microsoft Intermediate Language play while working with web services?",
    (2, "Question 3", "a. C# concepts"): "Elaborate implicit conversion, explicit conversion, casting operation, value data types and operator precedence.",
    (2, "Question 3", "b. Variable-sized arrays"): "How can variable-sized arrays be declared, initialized and implemented in C# environment?",
    (2, "Question 4", "a. Four pillars of OOP"): "Explain four major pillars of Object-Oriented paradigm with appropriate example.",
    (2, "Question 4", "b. Constructor and constructor overloading"): "Define constructor. How can constructors be overloaded? Explain.",
    (2, "Question 5", "a. Multilevel and hierarchical inheritance"): "Elaborate the difference between multilevel and hierarchical inheritance with a C# snippet.",
    (2, "Question 5", "b. Class visibility and abstract classes"): "Explain class visibility and abstract classes in C# language.",
    (2, "Question 6", "a. ADO.NET object model"): "Pictorially explain working of significant components of ADO.NET object model.",
    (2, "Question 6", "b. Typed and untyped datasets"): "Explain how typed datasets work differently than untyped datasets in ADO.NET environment.",
    (2, "Question 7", "a. CurrencyManager and filters"): "What important role does CurrencyManager play while implementing filters on data?",
    (2, "Question 7", "b. Steps to connect controls and datasets"): "Mention different steps required to establish connection between controls and datasets.",
    (2, "Question 8", "a. Breakpoints and Class View"): "Elaborate how Breakpoints and Class Viewer can assist in debugging .NET applications.",
    (2, "Question 8", "b. Cookies and session state"): "Differentiate between client-side and server-side state management in terms of Cookies and Session State respectively.",
    (2, "Question 9", "a. Validation controls"): "Detail out the usage of any two validation controls used in ASP.NET Framework with C# snippet.",
    (2, "Question 9", "b. Data-bound and data source controls"): "Explain how data can be accessed in ASP.NET applications with the help of data-bound and data source controls.",

    # PDF 4
    (3, "Question 1", "i. Monolithic assemblies"): "What are monolithic assemblies?",
    (3, "Question 1", "ii. Origins of .NET technology"): "Discuss the origins of .NET technology.",
    (3, "Question 1", "iii. Delegate modifiers"): "What are the modifiers that can be applied to a delegate?",
    (3, "Question 1", "iv. Operators that cannot be overloaded"): "List any two operators that cannot be overloaded in C# programming language.",
    (3, "Question 1", "v. ListBox and ComboBox"): "Differentiate between ListBox and ComboBox as standard controls.",
    (3, "Question 1", "vi. ADO.NET scalability"): "Brief out how ADO.NET applications support scalability feature.",
    (3, "Question 1", "vii. PostBack"): "Define PostBack concept available in ASP.NET Framework.",
    (3, "Question 1", "viii. Debugging in .NET"): "Brief out how debugging is carried out in .NET applications.",
    (3, "Question 2", "i. Major components of .NET Framework"): "Pictorially represent major components of .NET Framework along with functions performed by each component.",
    (3, "Question 2", "ii. Managed code as a wonder"): "Managed code in .NET environment is a wonder to programmers. Comment.",
    (3, "Question 3", "i. Mixed-mode arithmetic expression"): "Explain with apt example how mixed-mode arithmetic expression is evaluated in C# programming language.",
    (3, "Question 3", "ii. break, continue, label, foreach and boxing"): "Describe usage of break, continue, label, foreach and boxing in C# language.",
    (3, "Question 4", "i. Preventing inheritance using sealed classes and methods"): "Explain how inheritance can be prevented using sealed classes and sealed methods.",
    (3, "Question 4", "ii. Interfaces and classes"): "Define interfaces. Compare and contrast interfaces from classes with apt example.",
    (3, "Question 5", "i. Binary operator overloading"): "Detail out how binary operations can be overloaded in C# programming language.",
    (3, "Question 5", "ii. Delegate declaration, initialization and invocation"): "How does delegate provide power to programmers in terms of initialization, declaration and invocation? Give one example.",
    (3, "Question 6", "i. DataSet model with DataRelation, DataTable and DataView"): "Elaborate DataSet model used in ADO.NET environment including DataRelation, DataTable and DataView.",
    (3, "Question 6", "ii. Data binding and navigation"): "State the importance of data binding and navigation between records in data applications.",
    (3, "Question 7", "i. Displaying data through DataViews"): "Explain process of generating display of data through DataViews in ADO.NET.",
    (3, "Question 7", "ii. Windows Form, BindingContext and CurrencyManager"): "Elaborate how Windows Form, BindingContext and CurrencyManager work together for navigation between records.",
    (3, "Question 8", "i. Web server control, List control and validation controls"): "Define web server control. With C# snippet explain usage of List control and any two validation controls.",
    (3, "Question 8", "ii. Authorization methods in .NET"): "Elaborate any two methods used for purpose of authorization in .NET applications.",
    (3, "Question 9", "i. Caching as state management"): "Why is caching considered one of the most important parts of state management?",
    (3, "Question 9", "ii. Displaying data using data-bound controls"): "Elaborate any two ways used for displaying data on web forms using data-bound controls.",

    # PDF 5
    (4, "Question 1", "a. IL and cross-language integration"): "Intermediate Language provides true cross-language integration. Comment.",
    (4, "Question 1", "b. StringBuilder class"): "What is the purpose of using StringBuilder class in C# programming? Explain.",
    (4, "Question 1", "c. Four method modifiers"): "Name any four method modifiers available in C# language.",
    (4, "Question 1", "d. Error and exception"): "Differentiate between error and exception with an example.",
    (4, "Question 1", "e. Adding a new form object"): "Mention the steps how a new form object can be added in an existing project in Visual Studio.",
    (4, "Question 1", "f. Properties of RadioButton and RichTextBox"): "Write down any two properties associated with RadioButton and RichTextBox.",
    (4, "Question 1", "g. ASP.NET framework components"): "Briefly discuss different components of ASP.NET Framework.",
    (4, "Question 1", "h. Data binding importance"): "State the importance of data binding in ASP.NET applications.",
    (4, "Question 2", "i. Managed and unmanaged code"): "How is managed code different from unmanaged code? What metadata is used for this conversion?",
    (4, "Question 2", "ii. JIT compiler working"): "What do you understand by JIT compiler? Detail out its working with the help of labelled flowchart.",
    (4, "Question 3", "i. Literals and C# data types"): "Define literal and its types permissible in C#. Also present taxonomy of C# data types pictorially.",
    (4, "Question 3", "ii. Fall-through and foreach"): "With the help of C# snippet, explain concept of fall-through in switch case and usage of foreach loop.",
    (4, "Question 4", "i. Standard inheritance and containment inheritance"): "Prove that standard inheritance is different from containment inheritance with the help of diagram and example in C#.",
    (4, "Question 4", "ii. Inclusion polymorphism"): "Elaborate how inclusion polymorphism can be implemented in C# language. Also mention its advantages.",
    (4, "Question 5", "i. Interface instantiation"): "Why is instantiation of interfaces not possible? Give reasons and its solution.",
    (4, "Question 5", "ii. Delegates and four steps"): "What are delegates? Elaborate all four steps used for creating and using delegates in C# language.",
    (4, "Question 6", "i. ErrorProvider control"): "What functionality is associated with ErrorProvider control available in toolbox of Windows Form? Explain with an example.",
    (4, "Question 6", "ii. Windows Form life cycle"): "Detail out the various steps involved in the life cycle of Windows Form. Also mention one event for every phase.",
    (4, "Question 7", "i. Connected and disconnected approach"): "How does connected approach work differently from disconnected approach in retrieving data from any data source into Visual Studio with ADO.NET?",
    (4, "Question 7", "ii. CRUD operations with ADO.NET"): "Detail out all steps required to perform CRUD operations on data retrieved from SQL Server with ADO.NET. Explain any one CRUD operation.",
    (4, "Question 8", "i. ASP.NET application and page life cycle"): "Differentiate between ASP.NET Application and Page life cycle with an appropriate diagram.",
    (4, "Question 8", "ii. Authentication and authorization"): "Briefly explain how authentication and authorization can be achieved in ASP.NET applications.",
    (4, "Question 9", "i. Session in ASP.NET"): "What do you mean by session in ASP.NET? How are sessions created and used in ASP.NET environment?",
    (4, "Question 9", "ii. Validations, RangeValidator and CompareValidator"): "State importance of validations with ASP.NET application. Also detail use of RangeValidator and CompareValidator.",
}


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#17324d"),
            spaceAfter=18,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontSize=13,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#334155"),
        ),
        "pdf_title": ParagraphStyle(
            "pdf_title",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=26,
            textColor=colors.HexColor("#17324d"),
            spaceBefore=4,
            spaceAfter=8,
        ),
        "question": ParagraphStyle(
            "question",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=22,
            textColor=colors.HexColor("#1f4e79"),
            spaceBefore=12,
            spaceAfter=7,
        ),
        "part": ParagraphStyle(
            "part",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=21,
            textColor=colors.HexColor("#263238"),
            spaceBefore=8,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontSize=14,
            leading=21,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontSize=11.5,
            leading=17,
            textColor=colors.HexColor("#475569"),
        ),
        "diagram": ParagraphStyle(
            "diagram",
            parent=base["BodyText"],
            fontSize=11,
            leading=16.5,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#475569"),
            spaceBefore=3,
            spaceAfter=6,
        ),
        "code": ParagraphStyle(
            "code",
            parent=base["Code"],
            fontName="Courier",
            fontSize=10.5,
            leading=15.75,
        ),
        "subhead": ParagraphStyle(
            "subhead",
            parent=base["Heading4"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=21,
            textColor=colors.HexColor("#334155"),
            spaceBefore=8,
            spaceAfter=3,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["BodyText"],
            fontSize=14,
            leading=21,
            leftIndent=18,
            firstLineIndent=-10,
            spaceAfter=4,
        ),
    }


def add_para(story, text, style):
    for block in str(text).split("\n\n"):
        block = block.strip()
        if block:
            story.append(Paragraph(block.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), style))


def add_code(story, code, st):
    block = Table([[Preformatted(code, st["code"])]], colWidths=[6.25 * inch])
    block.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#d6dee8")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(block)
    story.append(Spacer(1, 4))


def add_section(story, heading, text, st):
    story.append(Paragraph(heading, st["subhead"]))
    add_para(story, text, st["body"])


def split_sentences(text, max_items=5):
    cleaned = text.replace("\n", " ").strip()
    parts = []
    current = ""
    for chunk in cleaned.split(". "):
        chunk = chunk.strip()
        if not chunk:
            continue
        if not chunk.endswith("."):
            chunk += "."
        current = chunk
        if len(current) > 35:
            parts.append(current)
        if len(parts) >= max_items:
            break
    return parts


def add_bullets(story, items, st):
    for item in items:
        story.append(Paragraph("- " + item.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), st["bullet"]))


def marker_and_title(part_title):
    if ". " in part_title:
        marker, title = part_title.split(". ", 1)
        return marker.strip(), title.strip()
    return "", part_title


def render_question_title(paper_index, q_title, part_title):
    marker, fallback = marker_and_title(part_title)
    full = QUESTION_TEXT.get((paper_index, q_title, part_title), fallback)
    number = q_title.replace("Question", "").strip()
    if marker:
        return f"{number}. ({marker}) {full}"
    return f"{number}. {full}"


def expected_length_label(q_title):
    if q_title == "Question 1":
        return ""
    return "Detailed Answer (Expected Length: According to marks, write as a long-answer explanation)"


def example_code_for(lower, code_snippets):
    if "stringbuilder" in lower or "string builder" in lower:
        return code_snippets["stringbuilder"]
    if "read-only property" in lower or "readonly property" in lower:
        return code_snippets["readonly"]
    if "jagged" in lower or "variable-sized" in lower:
        return code_snippets["jagged"]
    if "postback" in lower:
        return code_snippets["postback"]
    if "constructor" in lower:
        return code_snippets["constructor"]
    if "delegate" in lower and ("four steps" in lower or "callback" in lower):
        return code_snippets["delegate"]
    if "validation" in lower or "validator" in lower:
        return code_snippets["validation"]
    if "dataset" in lower and ("fill" in lower or "ado.net" in lower):
        return code_snippets["adonet"]
    if "gridview" in lower or "data-bound" in lower:
        return code_snippets["binding"]
    return None


def add_q1_answer(story, answer, lower, code_snippets, st):
    story.append(Paragraph("Answer:", st["subhead"]))
    add_para(story, answer, st["body"])
    code = example_code_for(lower, code_snippets)
    if code:
        story.append(Paragraph("Example:", st["subhead"]))
        add_code(story, code, st)


def add_long_answer(story, part_title, answer, lower, code_snippets, st):
    story.append(Paragraph("Answer:", st["subhead"]))
    story.append(Paragraph("Detailed Answer (Expected Length: write as a long-answer explanation according to marks)", st["small"]))

    story.append(Paragraph("Introduction / Basic Concept", st["subhead"]))
    add_para(story, answer, st["body"])

    key_points = split_sentences(answer)
    if key_points:
        story.append(Paragraph("Key Points", st["subhead"]))
        add_bullets(story, key_points, st)

    for section_heading, section_text in detailed_sections(part_title, answer):
        add_section(story, section_heading, section_text, st)

    code = example_code_for(lower, code_snippets)
    if code:
        story.append(Paragraph("Example:", st["subhead"]))
        add_code(story, code, st)

    story.append(Paragraph("Conclusion", st["subhead"]))
    add_para(
        story,
        "Thus, this concept is important in .NET because it improves clarity, reliability, reusability and practical application development. In an exam answer, it should be written with definition, working, key points, example and diagram wherever required.",
        st["body"],
    )


def add_diagram(story, diagram_path, caption, st):
    story.append(Spacer(1, 6))
    story.append(RLImage(diagram_path, width=6.25 * inch, height=3.8 * inch))
    story.append(Paragraph(caption, st["diagram"]))


def target_pages(q_title, part_title):
    if q_title == "Question 1":
        return 1
    # Most non-compulsory sub-questions in these papers are 8 marks. A few are
    # 6/10 marks, but the paper images mix that notation inconsistently; using
    # four pages for every long part keeps the booklet aligned with the user's
    # requested long-answer style.
    return 4


def topic_family(text):
    t = text.lower()
    if any(x in t for x in ["ado.net", "dataset", "dataadapter", "datatable", "dataview", "datareader", "currencymanager"]):
        return "data"
    if any(x in t for x in ["asp.net", "postback", "web server", "session", "cookie", "state", "gridview", "validation", "authentication", "authorization", "web service"]):
        return "asp"
    if any(x in t for x in ["inheritance", "class", "interface", "abstract", "sealed", "constructor", "delegate", "polymorphism", "object-oriented"]):
        return "oop"
    if any(x in t for x in ["clr", "msil", "jit", ".net framework", "managed", "assembly", "component model"]):
        return "framework"
    if any(x in t for x in ["windows form", "listbox", "combobox", "radiobutton", "richtextbox", "errorprovider", "dialog"]):
        return "winforms"
    return "general"


def extended_page_text(part_title, answer, page_no):
    family = topic_family(part_title + " " + answer)
    lead = (
        "This part can be expanded by connecting the definition with its working, "
        "its role in .NET application development, and a practical example. "
        "The explanation below continues the same answer in a fuller exam-writing style."
    )
    if family == "data":
        blocks = [
            "In data-driven .NET applications, the important point is how the application communicates with a data source and how records are represented after retrieval. ADO.NET separates connection-oriented objects from disconnected objects. This separation is useful because an application can open the connection only when it is actually required, fetch or update data quickly, and then release the database connection for other users.",
            "When writing this answer in detail, explain the movement of data: database to Connection, Command to execute the query, DataReader for fast connected reading, or DataAdapter to fill a DataSet. Inside the DataSet, DataTable, DataRow, DataColumn, Constraint, DataRelation, and DataView provide a memory-based relational structure. This makes filtering, sorting, editing, and navigation possible without keeping the database permanently connected.",
            "A practical example should mention a college database or student table. The application may show records in text boxes or a grid, allow the user to move between records, apply a filter such as course or city, and finally save changes back. This proves why the concept is not only theoretical but directly useful in Windows Forms and ASP.NET applications.",
        ]
    elif family == "asp":
        blocks = [
            "In ASP.NET, the browser and server communicate through HTTP requests and responses. Since HTTP is stateless, ASP.NET provides mechanisms such as ViewState, Session, Cookies, Cache, and Application state to preserve required information. Server controls, validation controls, data-bound controls, and authentication modules work together to create dynamic and secure web pages.",
            "A strong answer should explain the complete flow. The user sends a request, IIS and ASP.NET receive it, the page life cycle starts, controls are initialized, postback data is processed, server-side events are executed, and finally HTML is rendered to the browser. This flow explains why ASP.NET feels event-driven even though the web is request-response based.",
            "For practical writing, use examples such as login pages, student registration forms, GridView record display, and validation of age or email. These examples show where server-side processing, state management, and security checks are required. It is also important to mention that client-side validation improves speed, but server-side validation is compulsory for safety.",
        ]
    elif family == "oop":
        blocks = [
            "Object-oriented programming in C# focuses on designing software through classes, objects, members, and relationships. The main idea is to model real-world entities in a controlled way. Access modifiers protect data, constructors initialize objects, inheritance supports reuse, interfaces define contracts, and polymorphism allows flexible behavior at runtime.",
            "When extending this answer, connect the concept with maintainability. For example, an abstract class can define a common structure, an interface can define a required service, and derived classes can provide specific behavior. Delegates and events make objects communicate without tight coupling. These features reduce repeated code and make future changes easier.",
            "A suitable example is a base class Shape with derived classes Circle and Rectangle, or an interface IPrintable implemented by Report and Invoice. Such examples clearly show how C# applies object-oriented ideas in application development. Always mention rules, restrictions, and the reason behind using the concept.",
        ]
    elif family == "framework":
        blocks = [
            "The .NET Framework is built around managed execution. Source code written in C#, VB.NET, or another language is compiled into MSIL with metadata. CLR then verifies and executes this code using JIT compilation. This common execution model is the reason .NET supports language integration, type safety, and safer memory handling.",
            "A full answer should describe each layer: language compilers at the top, MSIL and metadata inside assemblies, CLR as the runtime engine, and Framework Class Library as the ready-made class collection. ASP.NET, ADO.NET, Windows Forms, XML classes, security classes, and networking classes all sit on this foundation.",
            "The practical importance is that programmers can focus on application logic rather than low-level memory management. Garbage collection, exception handling, thread management, and security verification are handled by CLR. Assemblies also improve deployment and version control compared with older COM-based development.",
        ]
    elif family == "winforms":
        blocks = [
            "Windows Forms applications are event-driven desktop applications. A form acts as a window and controls such as TextBox, Button, ListBox, ComboBox, RadioButton, RichTextBox, and DataGridView provide the user interface. Each control has properties for appearance, methods for behavior, and events for user actions.",
            "A detailed answer should mention how the form is designed in Visual Studio, how controls are placed from the Toolbox, how properties are set from the Properties window, and how event handlers are written in C#. The life cycle begins with object creation and initialization, continues through Load and user events, and ends with closing and disposal.",
            "Practical explanation can use an example such as a student entry form. TextBox accepts name, RadioButton accepts gender, ComboBox accepts course, ErrorProvider shows validation errors, and Button saves data. This makes the concept concrete and suitable for exam writing.",
        ]
    else:
        blocks = [
            "The concept should be explained by first giving its meaning, then connecting it with the problem it solves. In .NET development, most concepts exist to improve safety, reusability, performance, maintainability, or user interaction. Stating this purpose makes the answer stronger.",
            "After the meaning, describe the internal working or steps. If the question asks for differences, compare on basis of execution place, memory use, security, flexibility, performance, and practical use. If the question asks for a concept, include syntax, rules, and a short example.",
            "A complete answer should close by explaining where the concept is used in real applications. Examples from student records, login forms, database connectivity, report display, validation, or navigation make the answer easier to understand and more useful.",
        ]
    return lead + "\n\n" + blocks[(page_no - 2) % len(blocks)]


def detailed_sections(part_title, answer):
    text = (part_title + " " + answer).lower()

    if "component model" in text:
        return [
            ("Detailed Explanation", "A component model is important because modern applications are rarely written as one single block of code. They are normally divided into reusable parts such as data access components, business logic components, user interface components, and service components. Each component exposes its functionality through a known interface, so another part of the application can use it without knowing its internal code. In Microsoft technologies, the component model evolved because earlier applications needed reuse, language independence, distributed communication, and easier deployment."),
            ("Generation Wise Development", "COM was the first major model and focused on binary reuse. Its strength was that a component written in one language could be used by another language, but registry dependency and version conflicts made deployment difficult. COM+ added services required by enterprise applications, such as transactions, object pooling, and security. The .NET component model improved this further by using assemblies, metadata, CLR, and managed code. Instead of relying heavily on registry entries, .NET assemblies carry information about their own types and versions."),
            ("Challenges and Improvement", "The main challenge in COM was DLL Hell, where installing a newer version of a component could break older applications. COM+ solved some enterprise problems but remained complex. .NET reduced these problems through private assemblies, global assembly cache, strong names, and metadata-based type information. This makes development, deployment, debugging, and version control easier for web applications and services."),
            ("Exam Presentation", "In an exam answer, write the definition first, then explain COM, COM+, and .NET in order. For each generation, mention characteristics and challenges separately. End by saying that the .NET component model is more suitable for web services because it supports managed execution, language interoperability, metadata, assemblies, and easier deployment."),
        ]

    if "msil" in text or "jit" in text or "managed code" in text or ".net framework" in text or "clr" in text or "assembly" in text:
        return [
            ("Detailed Explanation", "The .NET Framework is based on the idea of managed execution. A programmer writes source code in C#, VB.NET, or another .NET language. The language compiler converts this source code into Microsoft Intermediate Language and stores it inside an assembly along with metadata. This means the output is not directly machine code at first. The CLR takes responsibility for verifying, compiling, and executing this intermediate code."),
            ("Working", "When a .NET application or web service runs, CLR loads the assembly, reads metadata, checks type safety, and uses the JIT compiler to convert required MSIL methods into native machine code. JIT compilation normally happens method by method, so a method is compiled when it is first called. After compilation, the native code can be reused during that execution. CLR also manages memory through garbage collection, handles exceptions, enforces security, and supports threading."),
            ("Importance in Web Development", "This model is very useful in web applications and services because the programmer gets language independence and a controlled runtime. A web service written in C# can use a component written in VB.NET because both are compiled into MSIL and follow the Common Type System. Metadata also helps tools understand classes, methods, parameters, and return types. This is why .NET can generate service descriptions and allow external applications to consume services."),
            ("Exam Presentation", "For a long answer, include a labelled diagram of source code, compiler, MSIL, CLR, JIT, and native code. Then explain the role of CLR services such as garbage collection, exception handling, security, and type safety. Finish by connecting MSIL with interoperability, portability, and safer execution."),
        ]

    if "implicit conversion" in text or "variable-sized" in text or "jagged" in text or "literal" in text or "fall-through" in text or "foreach" in text or "boxing" in text or "mixed-mode" in text:
        return [
            ("Detailed Explanation", "C# is a strongly typed language, so every variable has a fixed type. Because of this, conversion rules are important. Implicit conversion is allowed only when the compiler knows the conversion is safe, such as converting int to double. Explicit conversion is required when data may be lost, such as converting double to int. Casting tells the compiler that the programmer intentionally wants the conversion."),
            ("Programming Use", "Arrays, loops, literals, boxing, and operator precedence are basic but important parts of C# programming. Literals represent fixed values written directly in the program. Operator precedence decides which operation happens first. foreach makes collection traversal easier because the programmer does not manually handle indexes. Boxing converts a value type into object, while unboxing converts it back. These features are used often in forms, database programs, and ASP.NET code-behind files."),
            ("Example Based Explanation", "For variable-sized data, a jagged array is better than a rectangular array. If three students have appeared in different numbers of tests, each row can have a different length. For switch statements, C# prevents accidental fall-through, so each non-empty case should end with break, return, throw, or goto. This improves safety compared with languages where forgetting break may accidentally execute the next case."),
            ("Exam Presentation", "Write syntax and one small C# example for each concept. For conversions, show both implicit and explicit examples. For arrays, show declaration, initialization, and traversal. For loops, mention where each loop is best used. This makes the answer complete and easy to score."),
        ]

    if "constructor" in text:
        return [
            ("Detailed Explanation", "A constructor is used to initialize an object at the time of creation. Without proper initialization, an object may contain default or incomplete values. In C#, the constructor name is exactly the same as the class name and it has no return type. It may be default, parameterized, static, private, or overloaded depending on the requirement of the class."),
            ("Constructor Overloading", "Constructor overloading allows the same class to provide different ways of creating objects. For example, a Student object may be created with no data, only roll number, or roll number with name and course. The compiler selects the correct constructor by matching the number, type, and order of parameters. Constructor chaining using this() can reduce repeated initialization code."),
            ("Use in Applications", "In real .NET applications, constructors are used to set initial values, receive dependency objects, open required configuration, or prepare a form before display. A Windows Form constructor usually calls InitializeComponent(), which creates and configures all controls. In business classes, constructors help ensure that objects are valid from the beginning."),
            ("Exam Presentation", "For a long answer, define constructor, list its rules, explain overloading, write a C# example with three constructors, and show object creation for each constructor. End by stating that constructor overloading improves flexibility and object initialization."),
        ]

    if "inheritance" in text or "interface" in text or "abstract" in text or "sealed" in text or "polymorphism" in text or "object-oriented" in text or "class visibility" in text or "operator overloading" in text or "binary operator" in text:
        return [
            ("Detailed Explanation", "Object-oriented programming in C# is based on designing applications through classes, objects, and relationships. Encapsulation protects data, abstraction hides unnecessary details, inheritance supports reuse, and polymorphism allows different objects to respond differently to the same call. These ideas reduce duplicate code and make applications easier to extend."),
            ("C# Implementation", "C# implements inheritance using the colon symbol with one base class. It does not support multiple inheritance of classes, but it supports multiple interfaces. Interfaces define contracts, while classes provide implementation. Abstract classes are useful when some common implementation is required but some methods must be completed by child classes. Sealed classes and sealed methods restrict further inheritance or overriding when behavior must remain fixed."),
            ("Practical Example", "A common example is a Shape base class with Circle and Rectangle derived classes. Shape can define common members, while each derived class calculates area differently. A base class reference can point to a derived object, and overridden methods are selected at runtime. This is inclusion polymorphism. Similarly, an interface such as IPrintable can be implemented by Report, Invoice, and Certificate classes."),
            ("Exam Presentation", "For a strong answer, explain the concept, mention syntax rules, give a C# snippet, and then write practical use. If the question asks for comparison, compare inheritance with containment, interface with class, or multilevel inheritance with hierarchical inheritance using clear points and a diagram."),
        ]

    if "delegate" in text or "callback" in text:
        return [
            ("Detailed Explanation", "A delegate in C# is a type-safe reference to a method. It is called type-safe because the method assigned to a delegate must have the same return type and parameter list as the delegate declaration. Delegates are useful when one method needs to call another method indirectly, or when behavior must be passed as an argument."),
            ("Working Steps", "The four main steps are declaration, method definition, delegate object creation, and invocation. First, declare the delegate signature. Second, write a method matching that signature. Third, assign the method to the delegate variable. Fourth, invoke the delegate like a method. Delegates may also be multicast, meaning one delegate can hold references to more than one method."),
            ("Use in .NET", "Delegates are heavily used in event handling. When a button is clicked in Windows Forms or ASP.NET, an event is raised and a delegate calls the event handler method. Delegates also support callbacks, asynchronous programming, and loose coupling. They allow the caller to know the required signature without depending on a fixed method name."),
            ("Exam Presentation", "For a long answer, write the definition, draw the delegate flow diagram, explain all four steps, and include a short C# example. Mention that events in .NET are based on delegates, which makes the concept very important for GUI and web programming."),
        ]

    if "ado.net" in text or "dataset" in text or "datatable" in text or "dataview" in text or "datareader" in text or "dataadapter" in text or "currencymanager" in text or "crud" in text or "connected" in text or "disconnected" in text:
        return [
            ("Detailed Explanation", "ADO.NET is the data access technology of the .NET Framework. It allows applications to communicate with databases and other data sources. Its design supports both connected and disconnected data access. Connected access is useful when data must be read quickly and directly. Disconnected access is useful when data should be loaded into memory, used after closing the connection, and updated later."),
            ("Object Model Working", "The main connected objects are Connection, Command, and DataReader. Connection opens the link with the database. Command executes SQL statements or stored procedures. DataReader reads records in a fast, forward-only manner. The disconnected objects are DataAdapter and DataSet. DataAdapter works as a bridge between database and DataSet. DataSet stores data as DataTable, DataRow, DataColumn, Constraint, DataRelation, and DataView objects."),
            ("Application Use", "In a student management application, ADO.NET can retrieve student records from SQL Server, display them in a DataGridView or GridView, allow editing, and save changes. DataView can filter students by course or city. CurrencyManager or BindingSource can move between records. CRUD operations use INSERT, SELECT, UPDATE, and DELETE commands, preferably with parameters for safety."),
            ("Exam Presentation", "For a long answer, always include the ADO.NET architecture diagram. Then explain connected and disconnected objects separately. If the question asks about DataSet, explain DataTable, DataRelation, and DataView. If it asks about CRUD, write the steps and one example operation."),
        ]

    if "web server control" in text or "server controls" in text or "list control" in text:
        return [
            ("Detailed Explanation", "ASP.NET web server controls are controls that are declared on the page but processed on the server. They have the runat=\"server\" attribute and expose properties, methods, and events to server-side C# code. During rendering, ASP.NET converts these controls into HTML that the browser can understand."),
            ("Important Controls", "Common web server controls include Label, TextBox, Button, DropDownList, ListBox, CheckBoxList, RadioButtonList, Calendar, GridView, and FileUpload. List controls are used when the user must choose from multiple options. They can be filled manually or through data binding. Validation controls work with input controls to prevent invalid data from being submitted."),
            ("Working in ASP.NET", "When the user interacts with a server control, the page may post back to the server. ASP.NET restores control values, processes events such as Button_Click or SelectedIndexChanged, executes C# code, and then renders updated HTML. This makes web development feel similar to event-driven desktop programming while still using the HTTP request-response model."),
            ("Exam Presentation", "For a long answer, define web server controls, explain list controls, explain validation controls, and include a small ASPX/C# snippet. A neat diagram of page request, server-side processing, and rendered HTML can also be included."),
        ]

    if "validation" in text or "validator" in text:
        return [
            ("Detailed Explanation", "Validation means checking user input before it is accepted by the application. It is important because wrong data can cause errors, wrong reports, database inconsistency, and security problems. ASP.NET provides ready-made validation controls that can check required values, ranges, comparisons, patterns, and custom rules."),
            ("Common Controls", "RequiredFieldValidator checks that a field is not empty. RangeValidator checks that a value lies between minimum and maximum limits. CompareValidator compares a value with another control or fixed value. RegularExpressionValidator checks patterns such as email or phone number. CustomValidator allows programmer-defined validation logic. ValidationSummary can show all errors together."),
            ("Practical Use", "In a registration form, name should be required, age should be within a valid range, password and confirm password should match, and email should follow a pattern. ASP.NET can perform validation before server code saves the data. Page.IsValid should be checked in button-click code before database insertion."),
            ("Exam Presentation", "For a long answer, explain the need for validation, describe at least two validation controls, write ASPX markup, and show C# code using Page.IsValid. Mention that server-side validation is essential even when client-side validation is available."),
        ]

    if "windows form" in text or "winforms" in text or "listbox" in text or "combobox" in text or "dialog" in text or "errorprovider" in text or "radio button" in text or "rich text" in text:
        return [
            ("Detailed Explanation", "Windows Forms is used to build desktop applications in .NET. A form represents a window and controls are placed on it to accept input, display output, and respond to user actions. Visual Studio provides a designer, Toolbox, Properties window, Solution Explorer, and event editor to make development easier."),
            ("Controls and Events", "Every control has properties, methods, and events. Properties define appearance and state, such as Text, Name, Size, Enabled, Checked, and SelectedIndex. Methods perform actions. Events respond to user actions such as Click, TextChanged, SelectedIndexChanged, Load, FormClosing, and KeyPress. This event-driven model is central to Windows Forms programming."),
            ("Practical Use", "A student entry form may use TextBox for name, RadioButton for gender, ComboBox for course, ListBox for subjects, RichTextBox for address, ErrorProvider for validation errors, and Button for saving. A customized dialog box can be created as a separate form and opened using ShowDialog() when user confirmation or additional input is required."),
            ("Exam Presentation", "For a long answer, explain the form, controls, properties, and events. If the question asks about lifecycle, write constructor, Load, Shown, Activated, user events, FormClosing, FormClosed, and Dispose. If it asks about validation, include ErrorProvider or validation event example."),
        ]

    if "authentication" in text or "authorization" in text:
        return [
            ("Detailed Explanation", "Authentication and authorization are two different security stages. Authentication verifies the identity of the user. Authorization decides what the verified user is allowed to access. A user may be successfully authenticated but still not authorized to open an administrator page."),
            ("ASP.NET Working", "ASP.NET can support Forms Authentication, Windows Authentication, token-based authentication, and custom login systems. After authentication, the application may create an identity and assign roles. Authorization can then be applied through configuration, role checks, URL rules, or custom code. This protects pages, folders, services, and operations."),
            ("Practical Example", "In a college web application, a student, teacher, and administrator may all log in successfully. But students can view marks, teachers can enter marks, and administrators can manage users. This difference is authorization. Authentication answers who the user is; authorization answers what the user can do."),
            ("Exam Presentation", "For a long answer, write separate definitions, show the flow from login to protected resource, and compare both concepts. Mention that both are required for a secure ASP.NET application."),
        ]

    if "state" in text or "session" in text or "cookie" in text or "caching" in text or "postback" in text or "page life cycle" in text or "application life cycle" in text:
        return [
            ("Detailed Explanation", "Web applications need state management because HTTP is stateless. This means the server does not automatically remember previous requests. ASP.NET solves this through client-side and server-side techniques. Client-side techniques include ViewState, Cookies, QueryString, and HiddenField. Server-side techniques include Session, Application, Cache, and database storage."),
            ("Working", "Cookies store small values in the browser and are sent with requests. Session stores user-specific values on the server and identifies the user through a session ID. Cache stores frequently used data to improve performance. PostBack sends the same page back to the server so server-side events can be processed. During the page life cycle, ASP.NET restores state, loads controls, handles events, renders HTML, and unloads the page."),
            ("Practical Use", "Session is useful for login name, shopping cart, and temporary user selections. Cookies are useful for preferences such as theme or remembered username. Cache is useful for data that many users read repeatedly, such as category lists. ViewState is useful for preserving control values on the same page."),
            ("Exam Presentation", "For a long answer, explain why HTTP is stateless, then classify state management into client-side and server-side. If comparing cookies and session, mention storage place, security, size, lifetime, and server load. If explaining life cycle, write all stages in order with a diagram."),
        ]

    if "data-bound" in text or "data source" in text or "gridview" in text or "data binding" in text:
        return [
            ("Detailed Explanation", "Data binding connects a control directly with a data source so that records can be displayed with less manual code. In ASP.NET, data source controls fetch data, while data-bound controls present that data to the user. This separation makes the page easier to design and maintain."),
            ("Controls", "Common data source controls include SqlDataSource, ObjectDataSource, XmlDataSource, AccessDataSource, and LinqDataSource. Common data-bound controls include GridView, DetailsView, FormView, DataList, Repeater, DropDownList, and ListBox. GridView is widely used because it displays records in tabular form and supports sorting, paging, selection, editing, and deleting."),
            ("Practical Use", "A student record page can use SqlDataSource to run a SELECT query and GridView to show roll number, name, course, and marks. The same data can also be bound programmatically by filling a DataTable through ADO.NET and assigning it to GridView.DataSource. Calling DataBind() displays the records."),
            ("Exam Presentation", "For a long answer, write the difference between data source controls and data-bound controls. Then explain the binding process: connect, retrieve, assign source, bind, and display. Include a small GridView or SqlDataSource example."),
        ]

    if "web service" in text:
        return [
            ("Detailed Explanation", "A web service exposes application functionality over a network. It allows one application to call methods of another application using standard protocols. The client and service do not need to be written in the same language or run on the same platform. This makes web services very useful for integration."),
            ("Working", "The client sends a request through HTTP using SOAP, REST, XML, or JSON. The web service receives the request, executes business logic, may access a database, and returns a response. WSDL can describe SOAP services so that clients know available methods and parameters. REST services commonly use URLs and HTTP verbs."),
            ("Practical Use", "A payment service, weather service, login service, or student information service can be reused by websites, desktop applications, and mobile apps. In .NET, ASP.NET and the Framework Class Library provide classes for creating, hosting, and consuming such services."),
            ("Exam Presentation", "For a long answer, draw the client-protocol-service-database diagram. Then mention interoperability, loose coupling, reuse, standard protocols, and platform independence."),
        ]

    return [
        ("Detailed Explanation", "This concept should be explained by connecting its definition with its role in .NET development. A good answer should not stop at one line. It should mention why the concept is required, how it works internally or logically, and where it is used in real applications."),
        ("Working and Use", "In practical applications, .NET features are normally used together. For example, a form may validate input, ADO.NET may save the data, ASP.NET may display it, and CLR may manage execution. Explaining such connection makes the answer stronger and more realistic."),
        ("Exam Presentation", "Write the meaning first, then important points, then a short example, and finally the application. If the question asks for comparison, use separate points. If it asks for working, use steps and a diagram where suitable."),
    ]


def build_pdf():
    ensure_dirs()
    diagram_map = build_diagrams()
    st = styles()
    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        rightMargin=54,
        leftMargin=54,
        topMargin=50,
        bottomMargin=50,
        title="Web Development Using .NET Framework Combined Answers",
        author="Codex",
    )
    story = []
    story.append(Spacer(1, 1.6 * inch))
    story.append(Paragraph("Web Development Using .NET Framework", st["cover_title"]))
    story.append(Paragraph("Combined Corrected Answer Booklet for PDF 1 to PDF 5", st["cover_sub"]))
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph("Subject: Web Development Using .NET Framework<br/>Paper: 21MCA24C3", st["cover_sub"]))
    story.append(Spacer(1, 0.4 * inch))
    intro = [
        ["Answer Flow", "PDF 1 to PDF 5, and inside each paper Question 1 to Question 9 in order."],
        ["Language", "Clear exam-style explanation, not overly complex."],
        ["Diagrams", "Generated visual diagrams are embedded wherever useful for architecture, life cycle, inheritance, state management, web services, and ADO.NET."],
        ["Formatting", "Headings are used only where they make the answer clearer."],
    ]
    table = Table(intro, colWidths=[1.5 * inch, 4.8 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8f4ff")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b7c7d6")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEADING", (0, 0), (-1, -1), 12),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1f2937")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(table)
    story.append(PageBreak())

    code_snippets = {
        "stringbuilder": """StringBuilder sb = new StringBuilder("Hello");
sb.Append(" World");        // Efficient
sb.Insert(0, "Welcome ");
Console.WriteLine(sb);
// Output: Welcome Hello World""",
        "readonly": """class Student
{
    private int rollNo = 101;
    public int RollNo
    {
        get { return rollNo; }
    }
}""",
        "jagged": """int[][] marks = new int[3][];
marks[0] = new int[] { 80, 75 };
marks[1] = new int[] { 90, 85, 88 };
marks[2] = new int[] { 70 };""",
        "postback": """protected void Page_Load(object sender, EventArgs e)
{
    if (!IsPostBack)
    {
        // Runs only on first page load
    }
}""",
        "constructor": """class Student
{
    public Student() { }
    public Student(int rollNo) { }
    public Student(int rollNo, string name) { }
}""",
        "delegate": """public delegate void Notify(string message);

static void Show(string message)
{
    Console.WriteLine(message);
}

Notify n = Show;
n("Task completed");""",
        "validation": """if (Page.IsValid)
{
    lblResult.Text = "Data submitted successfully";
}""",
        "adonet": """SqlDataAdapter da = new SqlDataAdapter(
    "SELECT * FROM Students", con);
DataSet ds = new DataSet();
da.Fill(ds, "Students");""",
        "binding": """GridView1.DataSource = dataTable;
GridView1.DataBind();""",
    }

    for p_i, paper in enumerate(PDFS):
        story.append(Paragraph(paper["title"], st["pdf_title"]))
        story.append(Paragraph(paper["subtitle"], st["small"]))
        story.append(Spacer(1, 8))
        for q_title, parts, *maybe_diagram in paper["questions"]:
            diagram_added = False
            for part_index, (part_title, answer) in enumerate(parts):
                numbered_part_title = render_question_title(p_i, q_title, part_title)
                story.append(Paragraph(numbered_part_title, st["question"]))
                lower = (part_title + " " + answer).lower()
                if q_title == "Question 1":
                    add_q1_answer(story, answer, lower, code_snippets, st)
                else:
                    add_long_answer(story, part_title, answer, lower, code_snippets, st)
                if (
                    maybe_diagram
                    and maybe_diagram[0] in diagram_map
                    and not diagram_added
                    and part_index == 0
                ):
                    add_diagram(story, diagram_map[maybe_diagram[0]], f"Diagram related to {numbered_part_title}", st)
                    diagram_added = True
                story.append(Spacer(1, 5))
            story.append(Spacer(1, 5))
        if p_i != len(PDFS) - 1:
            story.append(PageBreak())

    doc.build(story)
    return OUT_PDF


if __name__ == "__main__":
    pdf = build_pdf()
    print(pdf)
