from django.dispatch import Signal

# Sent after an assessment is stored. kwargs: assessment, user.
# The recommendations module (not installed yet) connects here; this module never imports it.
assessment_submitted = Signal()
