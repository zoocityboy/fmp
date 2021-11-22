import * as vscode from 'vscode';

export class NoteComment implements vscode.Comment {
    id: number;
    label: string | undefined;
    constructor(
        public body: string | vscode.MarkdownString,
        public mode: vscode.CommentMode,
        public author: vscode.CommentAuthorInformation,
        public parent?: vscode.CommentThread,
        public contextValue?: string
    ) {
        this.id = ++CommentsService.commentId;
    }
}
export class CommentsService {
    static commentId: number = 0;
    constructor(context: vscode.ExtensionContext) {
        const commentController = vscode.comments.createCommentController('comment-sample', 'Comment API Sample');
        context.subscriptions.push(commentController);

        // A `CommentingRangeProvider` controls where gutter decorations that allow adding comments are shown
        commentController.commentingRangeProvider = {
            provideCommentingRanges: (document: vscode.TextDocument, token: vscode.CancellationToken) => {
                const lineCount = document.lineCount;
                return [new vscode.Range(0, 0, lineCount - 1, 0)];
            }
        };

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.createNote', (reply: vscode.CommentReply) => {
            replyNote(reply);
        }));

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.replyNote', (reply: vscode.CommentReply) => {
            replyNote(reply);
        }));

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.startDraft', (reply: vscode.CommentReply) => {
            const thread = reply.thread;
            thread.contextValue = 'draft';
            const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: 'vscode' }, thread);
            newComment.label = 'pending';
            thread.comments = [...thread.comments, newComment];
        }));

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.finishDraft', (reply: vscode.CommentReply) => {
            const thread = reply.thread;

            if (!thread) {
                return;
            }

            thread.contextValue = undefined;
            thread.collapsibleState = vscode.CommentThreadCollapsibleState.Collapsed;
            if (reply.text) {
                const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: 'vscode' }, thread);
                thread.comments = [...thread.comments, newComment].map(comment => {
                    comment.label = undefined;
                    return comment;
                });
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.deleteNoteComment', (comment: NoteComment) => {
            const thread = comment.parent;
            if (!thread) {
                return;
            }

            thread.comments = thread.comments.filter(cmt => (cmt as NoteComment).id !== comment.id);

            if (thread.comments.length === 0) {
                thread.dispose();
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.deleteNote', (thread: vscode.CommentThread) => {
            thread.dispose();
        }));

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.cancelsaveNote', (comment: NoteComment) => {
            if (!comment.parent) {
                return;
            }

            comment.parent.comments = comment.parent.comments.map(cmt => {
                if ((cmt as NoteComment).id === comment.id) {
                    cmt.mode = vscode.CommentMode.Preview;
                }

                return cmt;
            });
        }));

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.saveNote', (comment: NoteComment) => {
            if (!comment.parent) {
                return;
            }

            comment.parent.comments = comment.parent.comments.map(cmt => {
                if ((cmt as NoteComment).id === comment.id) {
                    cmt.mode = vscode.CommentMode.Preview;
                }

                return cmt;
            });
        }));

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.editNote', (comment: NoteComment) => {
            if (!comment.parent) {
                return;
            }

            comment.parent.comments = comment.parent.comments.map(cmt => {
                if ((cmt as NoteComment).id === comment.id) {
                    cmt.mode = vscode.CommentMode.Editing;
                }

                return cmt;
            });
        }));

        context.subscriptions.push(vscode.commands.registerCommand('gma.notes.dispose', () => {
            commentController.dispose();
        }));

        function replyNote(reply: vscode.CommentReply) {
            const thread = reply.thread;
            const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: 'vscode' }, thread, thread.comments.length ? 'canDelete' : undefined);
            if (thread.contextValue === 'draft') {
                newComment.label = 'pending';
            }

            thread.comments = [...thread.comments, newComment];
        }
    }
}