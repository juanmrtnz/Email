document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archived'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  //Post form content
  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    load_mailbox('sent');
    return false;
  };
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<div id="pageTitle">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</div>`;

  // Call route to get all emails from database
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {

        // Create the div for each email (parent) and set event for clicking on it
        const email_div = document.createElement('div');
        if (email.read === false) {
          email_div.className = 'emailList-emailUnread';
        } else {
          email_div.className = 'emailList-emailRead';
        }
        email_div.addEventListener('click', () => {
          load_email(email.id);
          mark_as_read(email.id);
        });
        // Create a different div (child) for each element of the email
        const sender_div = create_email_element_div(email.sender, 'emailList-sender');
        const subject_div = create_email_element_div(email.subject, 'emailList-subject');
        const body_div = create_email_element_div(email.body, 'emailList-body');
        const timestamp_div = create_email_element_div(email.timestamp, 'emailList-timestamp');

        // Append each element div (as a child) to the email div (parent)
        email_div.appendChild(sender_div);
        email_div.appendChild(subject_div);
        email_div.appendChild(body_div);
        email_div.appendChild(timestamp_div);

        // Append email div (parent) to the mailbox div
        document.querySelector('#emails-view').append(email_div);
      });
    })
}

function load_email(email_id) {

  // Show compose view and hide other views, and empty view from previous visualised emails
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').innerHTML = '';


  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {

    // Create the div for the whole email
    const email_div = document.createElement('div');
    email_div.className = 'emailPage-email';

    // Creat a div for each element of the email
    const sender_timestamp_div = create_email_element_div(`<div id="emailPage-sender">${email.sender}</div><div id="emailPage-timestamp">${email.timestamp}</div>`, 'emailPage-sender_timestamp');
    const recipients_div = create_email_element_div(`<i>to:</i> ${email.recipients}`, 'emailPage-recipients');
    const subject_div = create_email_element_div(email.subject, 'emailPage-subject');
    const hr = document.createElement('hr');
    const body_div = create_email_element_div(email.body, 'emailPage-body');

    // Append each element div (as a child) to email div (parent)
    email_div.appendChild(sender_timestamp_div);
    email_div.appendChild(recipients_div);
    email_div.appendChild(subject_div);
    email_div.appendChild(hr);
    email_div.appendChild(body_div);

    // Append email div to email view div
    document.querySelector('#email-view').append(email_div);

    // Create the reply button and append it to email view div
    const reply_button = document.createElement('button');
    reply_button.className = 'emailPage-replyButton';
    reply_button.innerHTML = "Reply";
    reply_button.addEventListener('click', () => {
      reply(email);
    });
    document.querySelector('#email-view').append(reply_button);

    // Create the archive button and append it to email view div
    const archive_button = document.createElement('button');
    archive_button.className = 'emailPage-archiveUnarchiveButton';
    if (email.archived === false) {
      archive_button.innerHTML = "Archive";
      archive_button.addEventListener('click', () => {
        archive(email.id);
        load_mailbox('inbox');
      });
      document.querySelector('#email-view').append(archive_button);
    } else {
      archive_button.innerHTML = "Unarchive";
      archive_button.addEventListener('click', () => {
        unarchive(email.id);
        load_mailbox('inbox');
      });
      document.querySelector('#email-view').append(archive_button);
    }
  })
}

function mark_as_read(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

function archive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })
}

function unarchive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })
}

function reply(email) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = email.sender;
    if (email.subject.startsWith("Re: ")) {
      document.querySelector('#compose-subject').value = email.subject;
    } else {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}\n\n`;
  
    document.querySelector('#compose-form').onsubmit = () => {
      fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        })
      })
      load_mailbox('sent');
      return false;
    };
}

function create_email_element_div(item, div_class) {
  const div = document.createElement('div');
  div.className = div_class;
  div.innerHTML = item;
  return div;
}
