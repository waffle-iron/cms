/**
 * Created by sghaida on 5/13/2017.
 */

var express         = require('express'),
    breadcrumbs     = require('express-breadcrumbs'),
    router          = express.Router(),
    middleware      = require('../middleware/authentication'),
    passport        = require('passport'),
    auth            = require('connect-ensure-login'),
    Announcement    = require('../models/announcement'),
    Department      = require('../models/department'),
    Tag             = require('../models/tag'),
    async           = require('async');


/* View all announcements based on category  */
router.get('/',auth.ensureLoggedIn('/login'), function (req,res, next) {

    //Check category from query field to render page. Default renders company announcements
    var category = req.query.category || 'company' ;

        Announcement.find({'category': category, 'status': 'Approved','toBeRemoved': { $ne: true}}).populate('department tags').sort({creationDate: 'desc'}).exec(function (err, announcements) {
            if (err) {
                console.log(err);
            } else {
                req.breadcrumbs([{name: 'Announcements', url: '/announcements'}, {name:  category, url: '/announcements/?category='+ category}]);
                res.render('announcements/view', {announcements: announcements, breadcrumbs: req.breadcrumbs()});
            }
        });
});

/* Submits new announcement */
router.post('/', auth.ensureLoggedIn('/login') , function (req, res, next) {
    Announcement.create(req.body.announcement, function (err, announcement) {
        if(err){
            console.log(err);
        } else {
            announcement.author.id = req.user._id;
            announcement.author.name = req.user.name;
            announcement.tags =req.body.announcement.tags

            announcement.department = req.body.announcement.department
            announcement.save();

            if(req.body['new-announcement'] === 'on') {
                res.redirect('/announcements/new')
            } else {
                res.redirect('/announcements/?category=' + req.body.announcement.category);
            }

        }
    });
});

/* shows the new announcement form */
router.get('/new', auth.ensureLoggedIn('/login'), function (req,res, next) {
   async.parallel([
           function (cb) {
               Tag.find({},cb);
           },
           function (cb) {
               Department.find({},cb);
           }
       ],function (err, result) {
            if(err) {
                console.log('fuckin error' + err)
            }else {
                console.log(result);
                req.breadcrumbs([{name: 'Announcements', url: '/announcements'}, {name: 'New', url: 'new'}]);
                res.render('announcements/new', {tags: result[0], departments: result[1], breadcrumbs: req.breadcrumbs()});
            }
   });

});

/* displays the list of pending announcements to be approved */
router.get('/approval', auth.ensureLoggedIn('/login'), middleware.validateRole('system-admin'), function(req, res,next){
    Announcement.find( {'status': 'Pending','toBeRemoved': { $ne: true}}).populate('author.id department').sort({creationDate: 'desc'}).exec(function (err, announcements) {
        if(err){
            console.log(err);
        }else {
            req.breadcrumbs([{name: 'Announcements', url: '/announcements'}, {name: 'Approval', url: 'approval'}]);
            res.render('announcements/approval', {announcements: announcements, breadcrumbs: req.breadcrumbs()});
        }
    });
});

/* show a single announcement*/
router.get('/:id', auth.ensureLoggedIn('/login'),function (req, res, next) {
    Announcement.find({_id: req.params.id}).populate('department tags').exec(function (err, announcement) {
        if(err){
            res.redirect('/announcements');
        } else {
            if(announcement.length > 0){
                req.breadcrumbs([{name: 'Announcements', url: '/announcements'}, {name: 'view', url: '/announcements/' + req.params.id}]);
                res.render('announcements/view', {announcements: announcement, breadcrumbs: req.breadcrumbs()});
            } else {
                res.redirect('/announcements');
            }
        }
    });
});

/* show edit form*/
router.get('/:id/edit', auth.ensureLoggedIn('/login'), function (req, res, next) {
    async.parallel([
        function (cb) {
            Tag.find({},cb);
        },
        function (cb) {
            Department.find({},cb);
        },
        function (cb) {
            Announcement.findById(req.params.id).populate('department').exec(cb);
        }
    ],function (err, result) {
        if(err) {
            console.log(err)
        }else {
            console.log(result);
            if(result[2] === null){
                req.breadcrumbs({name: 'Announcements', url: '/announcements'})
                res.redirect('/announcements', {breadcrumbs: req.breadcrumbs()});
            } else {
                req.breadcrumbs([{name: 'Announcements', url: '/announcements'}, {name: 'Edit', url: 'edit'}]);
                res.render('announcements/edit', {tags: result[0], departments: result[1], announcement: result[2], breadcrumbs: req.breadcrumbs()});
            }

        }
    });
});

/* update announcement */
router.put('/:id', auth.ensureLoggedIn('/login'), function (req, res, next) {
    Announcement.findByIdAndUpdate(req.params.id, req.body.announcement, function (err, toBeUpdated) {
        if(err){
            res.redirect('/announcements');
        } else {
            //if the user edits the form, the state changes to pending to be re-approved
            if(req.user.role.roleName === 'user'){
                toBeUpdated.status = 'Pending';
                toBeUpdated.save();
            }
            //if admin changes status to approved, transaction changes to approved
            if(req.body.announcement.status === "Approved"){
               toBeUpdated.transaction.isApproved = true;
               toBeUpdated.save();
            }
            res.redirect('/announcements');
        }
    });
});

/* get by tag refrence*/
router.get('/tag/:id', auth.ensureLoggedIn('/login'), function (req, res, next) {
   Announcement.find({'tags': Object(req.params.id)}).populate('department tags').exec(function (err, announcements) {
       if(err){
           console.log(err);
       }else {
           req.breadcrumbs([
               {name: 'Announcements', url: '/announcements'},
               {name: 'Tag', url: '/announcements/tag/' + req.params.id}
               ]);
           res.render('announcements/view', {announcements: announcements, breadcrumbs: req.breadcrumbs()});
       }
   });
});

/* get by department refrence*/
router.get('/department/:id', auth.ensureLoggedIn('/login'), function (req, res, next) {
    Announcement.find({'department': Object(req.params.id)}).populate('department tags').exec(function (err, announcements) {
        if(err){
            console.log(err);
        }else {
            req.breadcrumbs([
                {name: 'Announcements', url: '/announcements'},
                {name: 'Department', url: '/announcements/department/' + req.params.id}
            ]);
            res.render('announcements/view', {announcements: announcements, breadcrumbs: req.breadcrumbs()});
        }
    });
});

module.exports = router;

