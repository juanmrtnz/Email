from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Email(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="emails")
    sender = models.ForeignKey("User", on_delete=models.PROTECT, related_name="emails_sent")
    recipients = models.ManyToManyField("User", related_name="emails_received")
    subject = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)

    def serialize(self):
        recipients = [user.email for user in self.recipients.all()]
        recipients_list = []
        if len(recipients) == 1:
            recipients_list.append(recipients)
        else:
            for user in recipients:
                if user == user[0]:
                    recipients_list.append(user)
                else:
                    recipients_list.append(f' {user}')

        return {
            "id": self.id,
            "sender": self.sender.email,
            "recipients": recipients_list,
            "subject": self.subject,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%d/%b/%Y, at %H:%M"),
            "read": self.read,
            "archived": self.archived
        }
