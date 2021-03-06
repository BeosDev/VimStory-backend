var passport = require('passport');
LocalStrategy = require('passport-local').Strategy,
    UserModel = require('../models/user'),
    userSchemaValid = require('./validator').userSchema,
    Joi = require('joi');


function isValided(username, password) {
    const result = Joi.validate({
        Username: username,
        Password: password,
    }, userSchemaValid);
    console.log(result);
    if (result.error) return false;
    return true;
}

function validRegisterUser(req) {
    if (!req.body.U_Password || !req.body.U_RePassword || req.body.U_RePassword !== req.body.U_Password)
        return false;
    const result = Joi.validate({
        Username: req.body.U_Username,
        Password: req.body.U_Password,
        U_Email: req.body.U_Email,
        U_Address: req.body.U_Address,
        U_Phone: req.body.U_Phone
    }, userSchemaValid);
    if (result.error) return false;
    return true;
}

module.exports = function () {

    passport.serializeUser(function (user, done) {
        done(null, user);
    })

    passport.deserializeUser(function (user, done) {
        done(null, user);
    })

    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, username, password, done) {
        if (!isValided(username, password)) {
            return done(null, false, req.flash('loginMessage', "Tài khoản hoặc mật khẩu không đúng, xin vui lòng kiểm tra lại"));
        }
        var User = new UserModel.getOneUserViaUserName(username);
        User.once('results', function (results) {
            if (results.length !== 0 && UserModel.validPassword(password, results[0].Password)) {
                return done(null, results[0]);
            }
            return done(null, false, req.flash('loginMessage', 'Tài khoản hoặc mật khẩu không đúng, xin vui lòng kiểm tra lại'));
        })
        User.once('error', function (err) {
            return done(null, false, req.flash('loginMessage', 'Tài khoản hoặc mật khẩu không đúng, xin vui lòng kiểm tra lại'));
        })
    }))

    passport.use('local-register', new LocalStrategy({
        usernameField: 'U_Username',
        passwordField: 'U_Password',
        passReqToCallback: true
    }, function (req,username,password, done) {
        console.log(req.body);
        if (!validRegisterUser(req))
            return done(null, false, req.flash('registerMessage', 'Thông tin vừa nhập không hợp lệ, xin vui lòng kiểm tra lại'));
        console.log('pass auth register');
        var User = new UserModel.getOneUserViaUserName(username);
        User.once('results', function (results) {
            if (results.length > 0) {
                return done(null, false, req.flash('registerMessage','Tài khoản đã tồn tại'));
            }
            var ssUser = {
                Username: req.body.U_Username,
                Password: req.body.U_Password,
                U_Email: req.body.U_Email,
                U_Address: req.body.U_Address,
                U_Phone: req.body.U_Phone,
                U_Authorization: 1,
                U_FullName: req.body.U_FullName,
                U_Sex: req.body.U_Sex
            };
            var newUser = new UserModel.addUser(ssUser);
            newUser.once('results', function (results) {
                console.log('register: ',results);
                if (results.affectedRows > 0) {
                    ssUser['U_ID'] =  results.insertId;
                    console.log(ssUser);
                    return done(null, ssUser);
                } else
                    return done(null, false, req.flash('registerMessage', 'Thông tin vừa nhập không hợp lệ, xin vui lòng kiểm tra lại'));
            })
            newUser.once('error', function (err) {
                return done(null, false, req.flash('registerMessage', 'Tên tài khoản đã tồn tại'));
            })
        })
        User.once('error', function (err) {
            return done(null, false, req.flash('registerMessage', 'Thông tin vừa nhập không hợp lệ, xin vui lòng kiểm tra lại'));
        })
    }))


}