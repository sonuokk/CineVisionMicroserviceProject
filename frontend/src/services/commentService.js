import { apiClient } from "./apiClient";

export class CommentService {

    getCommentsByMovieId(movieId, pageNo, pageSize=5) {
        return apiClient.get("/movie/comments/getCommentsByMovieId/" + movieId + "/" + pageNo + "/" + pageSize);
    }

    getCountOfComments(movieId) {
        return apiClient.get("/movie/comments/getCountOfComments/" + movieId);
    }

    addComment(commentDto) {
        return apiClient.post("/movie/comments/add" , commentDto);
    }
    
    deleteComment(deleteCommentDto) {
        return apiClient.post("/movie/comments/delete" , deleteCommentDto);
    }
}
