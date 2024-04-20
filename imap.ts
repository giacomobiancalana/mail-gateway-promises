import { ImapFlow } from 'imapflow';

const client = new ImapFlow({
  host: 'ethereal.email',
  port: 993,
  secure: true,
  auth: {
      user: 'gbiancalana@eagleprojects.it',
      pass: ''
  }
});