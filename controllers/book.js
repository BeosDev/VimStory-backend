var bookModel = require('../models/book');
var formidable = require('formidable');
var fs = require('fs');
var createHTML = require('create-html');
var openfpt = require('./utils/openfpt');
var utils = require('util');
var path = require('path');
var likeModel = require('../models/like');

function likeBook(req, res) {
    console.log(req.params["bid"]);
    console.log(req.user.U_ID);
    var liker = new likeModel.isLike(req.params["bid"], req.user.U_ID);
    console.log('ok');
    liker.once('results', function (results) {
        console.log(results);
        if (results.length > 0) {
            // var removeLike = new likeModel.removeLike(req.params["bid"], req.user.U_ID);
            // removeLike.once('results', function (resRemoveLike) {
            //     console.log(resRemoveLike);
            //     if (resRemoveLike.affectedRows > 0)
            //         return res.json({isLike: 'false'});
            //     return res.json({isLike: 'true'});
            // });
            // removeLike.once('error', function (error) {
            //     res.json({isLike: 'true'});
            // });
            res.json({isLike: 'false'});
        } else {
            var addLike = new likeModel.addLike({
                B_ID: req.params["bid"],
                U_ID: req.user.U_ID
            });
            addLike.once('results', function (resAddLike) {
                console.log(resAddLike);
                if (resAddLike.affectedRows > 0)
                    return res.json({isLike: 'true'});
                return res.json({isLike: 'false'});
            });
            addLike.once('error', function (error) {
                return res.json({isLike: 'false'});
            });
        }
    })
}

function getBooks(req, res, next) {
    var books = new bookModel.getBooks;

    books.once('results', function (data) {
        if (data.length >= 0) {
            res.render('admin/adminBook', {
                title: 'Manage book - Vimstory',
                data: data
            }, function (err, html) {
                res.end(html);
            })
        }
    })
    books.once('error', () => res.redirect('/'));
}

function addBook(req, res, next) {
    var Name;
    var Content;
    var Description;
    var newpath;
    console.log('ok');
    var form = new formidable.IncomingForm();
    //set directory folder
    form.uploadDir = path.join(__dirname, '../', '\\public\\img\\');
    //form.uploadDir = path.join (__dirname, '/public/img');
    //xử lý upload
    form.parse(req, function (err, fields, file) {
        Name = fields.B_Name;
        Content = fields.B_Content;
        Description = fields.B_Description;
        //path tmp in server
        var pathImg = file.B_imageurl.path;
        if (file.B_imageurl.name.toString() != '') {
            //set up new path
            console.log('save img file')
            newpath = form.uploadDir + file.B_imageurl.name;

            fs.rename(pathImg, newpath, function (err) {
                if (err) throw err;
            });
        } else {
            fs.unlink(pathImg, (err) => {
                if (err) throw err;
                console.log(pathImg + ' was deleted');
            });
        }
        var books = new bookModel.addBook({
            B_Name: Name,
            B_Content: Content,
            B_Description: Description,
            B_imageurl: 'img/' + file.B_imageurl.name,
            C_ID: fields.C_ID,
            B_Age: fields.B_Age,
            B_PublishDate: fields.B_PublishDate,
            U_ID : req.user.U_ID,
            B_Active : 0
        });
        var maxBookID = new bookModel.getMaxID;

        req.isRedirect = false;
        books.once('results', function (results) {
            //console.log(mp3Link);
            maxBookID.once('results', function (data) {
                //console.log('maxbookid'+data[0].MaxVL);
                var textToSpeech = new openfpt(data[0].MaxVL, fields.B_Text);
                textToSpeech.once('done', () => console.log('exported'));
            });
            if (results.affectedRows > 0) {
                res.redirect('/admin/books');
            }
        });
        books.once('error', function (err) {
            res.redirect('/admin/books');
        });
    });
}

function deleteBook(req, res, next) {
    var books = new bookModel.deleteBook(req.params.id);
    req.isRedirect = false;
    books.once('results', function (results) {
        if (results.affectedRows > 0) {
            req.isRedirect = true;
            next();
        }
    });
    books.once('error', function (err) {
        next();
    });
}

function updateBook(req, res, next) {

    var Name;
    var Content;
    var Description;
    var newpath;
    console.log('ok');
    var form = new formidable.IncomingForm();
    //set directory folder
    form.uploadDir = path.join(__dirname, '../', '\\public\\img\\');
    //form.uploadDir = path.join (__dirname, '/public/img');
    //xử lý upload
    form.parse(req, function (err, fields, file) {
        Name = fields.B_Name;
        Content = fields.B_Content;
        Description = fields.B_Description;

        //path tmp in server
        var path = file.B_imageurl.path;
        if (file.B_imageurl.name.toString() != '') {
            //set up new path
            console.log('save img file')
            newpath = form.uploadDir + file.B_imageurl.name;

            fs.rename(path, newpath, function (err) {
                if (err) console.log(err);
            });
        } else {
            fs.unlink(path, (err) => {
                if (err) console.log(err);
                console.log(path + ' was deleted');
            });
        }

        var books = new bookModel.updateBook({
            B_Name: Name,
            B_Content: Content,
            B_Description: Description,
            B_imageurl: 'img/' + file.B_imageurl.name,
            C_ID: fields.C_ID,
            B_Age: fields.B_Age,
            B_PublishDate: fields.B_PublishDate,
            U_ID : req.user.U_ID
        }, fields.B_ID);
        //var maxBookID = new bookModel.getMaxID;
        req.isRedirect = false;
        books.once('results', function (results) {
            //console.log('maxbookid'+data[0].MaxVL);
            var textToSpeech = new openfpt(fields.B_ID, fields.B_Text);
            textToSpeech.once('done', () => console.log('exported'));
            if (results.affectedRows > 0) {
                res.redirect('/admin/books');
            }
        });
        books.once('error', function (err) {
            res.redirect('/admin/books');
        });
    });

}

function getOneBook(req, res, next, pathRender, titleBook) {
    var books = new bookModel.getOneBook(req.params.id);
    //var author = new authorModel.getAuthorsByBookId(req.params.id);
    var category = new categoryModel.getCategories();
    books.once('results', function (data) {
        console.log(data);
        if (data.length > 0) {
            //author.once('results',function(authorsData){
            //if(authorsData.length > 0)
            // {
            category.once('results', function (categoryData) {
                var titleBook = data[0].B_Name;
                var html = createHTML({
                    title: 'Content',
                    head: '<meta name="description" content="example">',
                    body: data[0].B_Content
                })
                fs.writeFile(path.join(__dirname, '../', '\\views\\index\\readBookContent.ejs'), html, function (err) {
                    if (err) console.log(err)
                })
                console.log(data[0].B_PublishDate);
                var userid;
                if(req.user!=null) userid=req.user.U_ID;
                else userid=-1;
                res.render(pathRender, {
                    title: titleBook,
                    data: data[0],
                    //authors : authorsData,
                    categories: categoryData,
                    User_ID : userid,
                    Book_ID : req.params.id 
                }, function (err, html) {
                    res.end(html);
                })
            });

            // }
            //else{
            //  //   res.end('error');
            // }
            //);

        } else res.end('error');

    });
}


var categoryModel = require('../models/category');
var authorModel = require('../models/author');

function getAddBookPage(req, res, next) {
    var category = new categoryModel.getCategories();
    var author = new authorModel.getAuthors();
    category.once('results', function (data) {
        if (data.length > 0) {
            console.log(data);
            //console.log(listCategory);
            author.once('results', function (results) {
                if (results.length > 0) {

                    console.log(results);
                    res.render('admin/addBook', {
                        title: 'Add new book - Vimstory',
                        categories: data,
                        authors: results

                    });
                } else res.end('error');

            })
        } else res.end('error');

    });
}

function getUpdateBookPage(req, res, next) {
    var category = new categoryModel.getCategories();
    var author = new authorModel.getAuthors();
    var book = new bookModel.getOneBook(req.params.id);

    category.once('results', function (data) {
        if (data.length > 0) {
            //console.log(data);
            //console.log(listCategory);
            author.once('results', function (results) {
                if (results.length > 0) {
                    book.once('results', function (bookData) {
                        //console.log(bookData);
                        res.render('admin/updateBook', {
                            title: 'Update book - Vimstory',
                            categories: data,
                            authors: results,
                            book: bookData


                        });
                    });

                } else res.end('error');

            })
        } else res.end('error');

    });
    //});
}

function searchBooks(req, res, next) {
    var categories = categoryModel.getCategories();
    var pageLimit = 9;
    var name = req.query['search'];
    if (utils.isNullOrUndefined(name)) name = "";
    var page = req.query['page'];
    if (utils.isNullOrUndefined(page)) page = 1;
    var searchBooks = bookModel.searchBooks(page, pageLimit, name); //#2
    categories.once('results', function (cate) {
        if (cate.length > 0) {
            searchBooks.once('results', function (results) {
                console.log(results);
                if (results.length > 0) {
                    res.render('index/searchBook', {
                        title: 'Search book - Vimstory',
                        categories: cate,
                        data: results,
                        pageNum: page,
                        keyword: name,
                    })
                } else res.end('error');
            });
        } else res.end('error');
    });
}

function getUserBooks(req, res, next) {
    console.log('get user books');
    if (req.user != null) {
        var books = new bookModel.getUserBooks(req.user.U_ID);
        console.log(req.user.U_ID);
        books.once('results', function (data) {
            if (data.length >= 0) {
                console.log(data);
                res.render('index/user/books', {
                    title: 'Manage book - Vimstory',
                    data: data
                }, function (err, html) {
                    res.end(html);
                })
            }
        })
        books.once('error', () => res.redirect('/'));
    } else res.redirect('/');
}

function getUserUpdateBookPage(req, res, next) {
    var category = new categoryModel.getCategories();
    var author = new authorModel.getAuthors();
    var book = new bookModel.getOneBook(req.params.id);

    category.once('results', function (data) {
        if (data.length > 0) {
            author.once('results', function (results) {
                if (results.length > 0) {
                    book.once('results', function (bookData) {
                        res.render('index/user/editBook', {
                            title: 'Update book - Vimstory',
                            categories: data,
                            authors: results,
                            book: bookData
                        });
                    });

                } else res.end('error');

            })
        } else res.end('error');

    });
//});
 }

 function userAddBook(req, res, next) {
    var Name;
    var Content;
    var Description;
    var newpath;
    console.log('ok');
    var form = new formidable.IncomingForm();
    //set directory folder
    form.uploadDir = path.join (__dirname,'../', '\\public\\img\\');
    //form.uploadDir = path.join (__dirname, '/public/img');
    //xử lý upload
    form.parse(req, function (err, fields, file) {
        Name = fields.B_Name;
        Content = fields.B_Content;
        Description = fields.B_Description;
        //path tmp in server
        var pathImg = file.B_imageurl.path;
        if (file.B_imageurl.name.toString() != '') {
            //set up new path
            console.log('save img file')
            newpath = form.uploadDir + file.B_imageurl.name;

            fs.rename(pathImg, newpath, function (err) {
                if (err) throw err;
            });
        } else {
            fs.unlink(pathImg, (err) => {
                if (err) throw err;
                console.log(pathImg + ' was deleted');
            });
        }
        var books = new bookModel.addBook({
            B_Name: Name,
            B_Content: Content,
            B_Description: Description,
            B_imageurl: 'img/' + file.B_imageurl.name,
            C_ID: fields.C_ID,
            B_Age: fields.B_Age,
            B_PublishDate: fields.B_PublishDate,
            U_ID : req.user.U_ID,
            B_Active : 1
        });
        var maxBookID = new bookModel.getMaxID;

        req.isRedirect = false;
        books.once('results', function (results) {
            //console.log(mp3Link);
            maxBookID.once('results', function (data) {
                //console.log('maxbookid'+data[0].MaxVL);
                var textToSpeech = new openfpt(data[0].MaxVL, fields.B_Text);
                textToSpeech.once('done',() => console.log('exported'));
            });
            if (results.affectedRows > 0) {
                res.redirect('/user/books');
            }
        });
        books.once('error', function (err) {
            res.redirect('/user/books');
        });
    });
}

function getUserAddBookPage(req, res, next) {
    var category = new categoryModel.getCategories();
    var author = new authorModel.getAuthors();
    category.once('results', function (data) {
        if (data.length > 0) {
            console.log(data);
            //console.log(listCategory);
            author.once('results', function (results) {
                if (results.length > 0) {

                    console.log(results);
                    res.render('index/user/addBook', {
                        title: 'Add new book - Vimstory',
                        categories: data,
                        authors: results

                    });
                } else res.end('error');

            })
        } else res.end('error');

    });
}

function getVerifyBooks(req,res,next)
{
    var books = new bookModel.getVerifyBook;

    books.once('results', function (data) {
        if (data.length >= 0) {
            res.render('admin/penddingBook', {
                title: 'Verify book - Vimstory',
                data: data
            }, function (err, html) {
                res.end(html);
            })
        }
    })
    books.once('error',() => res.redirect('/'));
}

function verifyBook(req,res,next)
{
    var books = new bookModel.verifyBook(req.params.id);
    req.isRedirect = false;
    books.once('results', function (results) {
        if (results.affectedRows > 0) {
            req.isRedirect = true;
            next();
        }
    });
    books.once('error', function (err) {
        next();
    });
}

function countLike(req,res){
    var numLike = new likeModel.getLikeByBid(req.params.bid);
    numLike.once("results",num => res.json({numLike:num.length}));
    numLike.once("error",err => res.json({numLike:0}));
}

module.exports = {
    getBooks,
    addBook,
    deleteBook,
    updateBook,
    getOneBook,
    getAddBookPage,
    searchBooks,
    getUpdateBookPage,
    getUserBooks,
    getUserUpdateBookPage,
    userAddBook,
    getUserAddBookPage,
    getVerifyBooks,
    verifyBook,
    likeBook,
    countLike
}