'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var PouchDB = require('pouchdb');
var db = new PouchDB('dbname');
var remoteCouch = 'http://localhost:8989/couchdb/dbname';

var CommentBox = React.createClass({
    getInitialState: function() {
        db.changes({
            since: 'now',
            live: true
        }).on('change', this.onDataChanged);
        var opts = {live: true};
        db.replicate.to(remoteCouch, opts, this.syncError);
        db.replicate.from(remoteCouch, opts, this.syncError);
        return {data: []};
    },
    syncError: function(error) {
        console.log(error);
    },
    onDataChanged: function() {
        db.allDocs({include_docs: true, descending: false}, function(err, doc) {
            var comments = doc.rows.map(function (row) {return row.doc});
            this.setState({data: comments});
            console.log('Successfully loaded comments');
        }.bind(this));
    },
    handleCommentSubmit: function(comment) {
        comment._id = Date.now().toString();
        db.put(comment, function callback(err, result) {
            if (err) {
                console.log('Error: ' + err);
            } else {
                console.log('Successfully posted a comment!');
            }
        });
    },
    componentDidMount: function() {
        this.onDataChanged();
    },
    render: function() {
        return (
        /*jshint ignore:start */
        <div className="commentBox">
            <h1>Comments</h1>
            <CommentList data={this.state.data} />
            <CommentForm onCommentSubmit={this.handleCommentSubmit} />
        </div>
        /*jshint ignore:end */
        );
    }
    });
    
    var CommentList = React.createClass({
    render: function() {
        var commentNodes = this.props.data.map(function(comment) {
        return (
            /*jshint ignore:start */
            <Comment author={comment.author} key={comment._id}>
            {comment.text}
            </Comment>
            /*jshint ignore:end */
        );
        });
        return (
        /*jshint ignore:start */
        <div className="commentList">
            {commentNodes}
        </div>
        /*jshint ignore:end */
        );
    }
    });
    
    var Comment = React.createClass({
    render: function() {
        return (
        /*jshint ignore:start */
        <div className="comment">
            <h2 className="commentAuthor">
            {this.props.author}
            </h2>
            {this.props.children}
        </div>
        /*jshint ignore:end */
        );
    }
    });
    
    var CommentForm = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        var author = this.refs.author.value.trim();
        var text = this.refs.text.value.trim();
        if (!text || !author) {
        return;
        }
        this.props.onCommentSubmit({author: author, text: text});
        this.refs.text.value = '';
        return;
    },
    render: function() {
        return (
        /*jshint ignore:start */
        <form className="commentForm" onSubmit={this.handleSubmit}>
            <input type="text" placeholder="Your name" ref="author" />
            <input type="text" placeholder="Say something..." ref="text" />
            <input type="submit" value="Post" />
        </form>
        /*jshint ignore:end */
        );
    }
    });
    
    ReactDOM.render(
    /*jshint ignore:start */
    <CommentBox url="/api/comments" pollInterval={2000} />,
    /*jshint ignore:end */
    document.getElementById('content')
    );