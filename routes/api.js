/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; 
//MongoClient.connect(CONNECTION_STRING, function(err, db) {});
// MongoClient.connect(CONNECTION_STRING, function(err, db) {
//   if (err) {
//     console.log('Connection: error')
//   }
//   console.log('Connection successful!')
// });

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    //I can GET /api/issues/{projectname} for an array of all issues on that specific project with all
    //the information for each issue as was returned when posted.
    //I can filter my get request by also passing along any field and value in the query
    //(ie. /api/issues/{project}?open=false). I can pass along as many fields/values as I want.
    //Example usage: /api/issues/{project}
    //               /api/issues/{project}?open=true&assigned_to=Joe
    .get(function (req, res){
      var project = req.params.project;
      var currentCollection = 'issue_'+project;

      if (req.query.open !== undefined){
        req.query.open = (req.query.open == 'true')
      }

      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(currentCollection).find(req.query).toArray((err,result)=>{
          if (err) throw err
          res.send(result)
        });
      });
      
    })
    
    //I can POST /api/issues/{projectname} with form data containing required issue_title, issue_text,
    //created_by, and optional assigned_to and status_text.
    //The object saved (and returned) will include all of those fields (blank for optional no input) 
    //and also include created_on(date/time), updated_on(date/time), open(boolean, true for open, false for closed),
    //and _id.
    .post(function (req, res){
      var project = req.params.project;
      var currentCollection = 'issue_'+project;
      //console.log(currentCollection); => issue_apitest

      if (req.body.issue_title == undefined |
          req.body.issue_text == undefined |
          req.body.created_by == undefined ){
        res.status(500)
        res.render('error', { error: 'Required text not filled' })
      }

      var created_on = new Date();
      var updated_on = created_on;
      var open = true;
      var newIssue = {
        issue_title: req.body.issue_title,
        issue_text:  req.body.issue_text,
        created_by:  req.body.created_by,
        assigned_to: req.body.assigned_to,
        status_text: req.body.status_text,
        created_on,
        updated_on,
        open
      }

      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(currentCollection ).insertOne(newIssue,
          (err,doc) => {
            if (err){
              console.log('New issue: insertOne error')
            } else {
              console.log('Issued submited and saved')
              res.json(newIssue)
            }
          }
        )
      });
    })
    
    //I can PUT /api/issues/{projectname} with a _id and any fields in the object with a value to object said object.
    //Returned will be 'successfully updated' or 'could not update '+_id. This should always update updated_on.
    //If no fields are sent return 'no updated field sent'.
    .put(function (req, res){
      var project = req.params.project;
      var currentCollection = 'issue_'+project;

      const updatedFields = {};
      const notEmpty = value =>(
        value != undefined &
        value != null &
        value != '' )
            

      Object.keys(req.body).forEach(key => {
        console.log(req.body[key]);
        if (notEmpty(req.body[key])) {
          if (key=='open') {
            updatedFields[key] = (req.body[key] != 'false')
            console.log(updatedFields[key]);
          } else {
            updatedFields[key] = req.body[key]
          }
        }
      });

      if (Object.keys(updatedFields).length <= 1) {
        console.log('no updated field sent')
        res.send('no updated field sent')
      } else {
        updatedFields['updated_on'] = new Date();
        delete updatedFields['_id']
        // console.log(updatedFields)
        //https://docs.mongodb.com/manual/reference/method/db.collection.findAndModify/
        // db.collection.findAndModify({
        //     query: <document>,
        //     sort: <document>,
        //     remove: <boolean>,
        //     update: <document or aggregation pipeline>, // Changed in MongoDB 4.2
        //     new: <boolean>,
        //     fields: <document>,
        //     upsert: <boolean>,
        //     bypassDocumentValidation: <boolean>,
        //     writeConcern: <document>,
        //     collation: <document>,
        //     arrayFilters: [ <filterdocument1>, ... ]
        // });
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
          db.collection(currentCollection).findAndModify(
            {_id: ObjectId(req.body._id)},
            {}, 
            { $set: updatedFields }
            ,
            (err,doc) => {
              if (err){
                console.log(err)
                console.log('could not update '+req.body._id)
                res.send('could not update '+req.body._id)
              } else {
                console.log('Issue Updated')
                res.send('successfully updated')
              }
            }
          )
        });
      }
      
    })
    
    //I can DELETE /api/issues/{projectname} with a _id to completely delete an issue.
    //If no _id is sent return '_id error', success: 'deleted '+_id, failed: 'could not delete '+_id.
    .delete(function (req, res){
      var project = req.params.project;
      var currentCollection = 'issue_'+project;
      if (req.body._id == undefined){
        res.send('_id error')
      } else {
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
          db.collection(currentCollection).findAndModify(
             {_id: ObjectId(req.body._id)},
             {}, 
             {remove:true}
            ,
            (err,doc) => {
              if (err){
                console.log(err)
                console.log('could not delete '+req.body._id)
                res.send('could not delete '+req.body._id)
              } else {
                console.log('deleted '+req.body._id)
                res.send('deleted '+req.body._id)
              }
          });
        });
      }
      
    });
    
};
