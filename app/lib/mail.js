var sendgrid  = require('sendgrid')(process.env.SENDGRID_API_KEY);

const Mail = {};

Mail.send = function (options, cb) {
    sendgrid.send({
        to: [options.email],
        from: options.dev_email || process.env.DEV_EMAIL,
        subject: options.subject,
        html: options.text,
        toname:[options.toname],
        fromname:options.fromname
    }, function (err, json) {
        if (err) { console.log("MailError", err); }
        cb();
    });
}


module.exports = Mail;