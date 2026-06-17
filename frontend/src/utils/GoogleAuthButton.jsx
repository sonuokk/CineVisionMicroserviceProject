import React, { useEffect, useRef, useState } from 'react'

const googleScriptUrl = "https://accounts.google.com/gsi/client";

let googleScriptPromise;

export default function GoogleAuthButton({ onCredential, disabled, label = "Continue with Google" }) {
    const buttonRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    useEffect(() => {
        if (!clientId) {
            return;
        }

        loadGoogleScript()
            .then(() => {
                if (!window.google || !buttonRef.current) {
                    return;
                }
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: response => {
                        if (response?.credential) {
                            onCredential(response.credential);
                        }
                    }
                });
                buttonRef.current.innerHTML = "";
                window.google.accounts.id.renderButton(buttonRef.current, {
                    theme: "outline",
                    size: "large",
                    shape: "pill",
                    width: 360,
                    text: "continue_with"
                });
                setIsReady(true);
            })
            .catch(() => setIsReady(false));
    }, [clientId, onCredential]);

    if (!clientId) {
        return (
            <button type="button" className="btn google-auth-fallback" disabled>
                <i className="fa-brands fa-google me-2"></i>Google sign-in not configured
            </button>
        );
    }

    return (
        <div className={`google-auth-wrapper ${disabled ? "disabled" : ""}`} aria-label={label}>
            <div ref={buttonRef}></div>
            {!isReady ? <button type="button" className="btn google-auth-fallback" disabled>Loading Google...</button> : null}
        </div>
    );
}

function loadGoogleScript() {
    if (googleScriptPromise) {
        return googleScriptPromise;
    }

    googleScriptPromise = new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
            resolve();
            return;
        }

        const existingScript = document.querySelector(`script[src="${googleScriptUrl}"]`);
        if (existingScript) {
            existingScript.addEventListener("load", resolve, { once: true });
            existingScript.addEventListener("error", reject, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = googleScriptUrl;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return googleScriptPromise;
}
