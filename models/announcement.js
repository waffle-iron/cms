/**
 * Created by sghaida on 5/11/2017.
 */

var mongo   = require('mongoose'),
    Schema  = mongo.Schema;

var announcementSchema = new Schema({
    title: String,
    body: String,
    imageUrl: {type: String, default: ''},
    creationDate: {type: Date, default: Date.now},
    archiveAfter: {type: Number, default: 30},
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    author: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String
    },
    tags : [{
        type: Schema.Types.ObjectId,
        ref: 'Tag'
    }]
});

module.exports = mongo.model('Announcement', announcementSchema);
