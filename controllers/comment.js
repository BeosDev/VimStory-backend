var commentMoldel = require("../models/comment");

function addComment(req,res){
    
    var commnetLength = req.body.C_Content.toString().length;
    if(commnetLength > 250){
        return res.send('Error');
    }
    var comment = new commentMoldel.addComment(req.body);
    comment.once('results',function(results){
        return 0;
    });
    comment.once('error',function(err){
        res.end('error');
    })
}

function getComments(req,res,next){
    var comment = commentMoldel.getCommentsByBookId(req.params.id);
    comment.once('results', function(data){
        if(data.length>0){
            res.send(data);
        }
        else res.end("error");
    });
    comment.once('error',function(err){
        res.end('err');
    })
}

function getCommentsByBookId(bookId){
    var comments = commentMoldel.getCommentsByBookId(bookId);
    comments.once('results', function(data){
        if(data.length>0){
            console.log(data);
            return data;
        }
    });
}


module.exports = {
    addComment,
    getComments,
    getCommentsByBookId
}