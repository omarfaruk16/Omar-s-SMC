from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from .constants import DEFAULT_FIELD_SPECS, FIELD_SPEC_BY_NAME


class AdmissionFormTemplate(models.Model):
    """Configurable admission form template definition."""

    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True, blank=True, help_text="Used to reference this template in URLs.")
    description = models.CharField(max_length=255, blank=True)

    school_name = models.CharField(max_length=255)
    school_address = models.TextField(blank=True)
    eiin_number = models.CharField(max_length=64, blank=True)
    slogan = models.CharField(max_length=255, blank=True)
    footer_text = models.CharField(max_length=255, blank=True)
    footer_secondary_text = models.CharField(max_length=255, blank=True)

    logo = models.ImageField(upload_to="admissions/logos/", blank=True, null=True)
    background_image = models.ImageField(upload_to="admissions/backgrounds/", blank=True, null=True)

    header_background_color = models.CharField(max_length=7, default="#1f2937", help_text="Hex color for header background.")
    header_text_color = models.CharField(max_length=7, default="#ffffff")
    primary_color = models.CharField(max_length=7, default="#2563eb")
    accent_color = models.CharField(max_length=7, default="#1e40af")
    text_color = models.CharField(max_length=7, default="#111827")

    header_font_name = models.CharField(max_length=64, default="Helvetica-Bold")
    body_font_name = models.CharField(max_length=64, default="Helvetica")
    label_font_size = models.PositiveSmallIntegerField(default=11)
    body_font_size = models.PositiveSmallIntegerField(default=10)

    watermark_text = models.CharField(max_length=255, blank=True)
    signature_caption = models.CharField(max_length=255, blank=True, default="Guardian Signature")

    is_default = models.BooleanField(default=False)
    layout_metadata = models.JSONField(blank=True, default=dict, help_text="Optional JSON to further customise the layout.")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-updated_at"]
        verbose_name = "Admission Form Template"
        verbose_name_plural = "Admission Form Templates"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
        if self.is_default:
            type(self).objects.exclude(pk=self.pk).update(is_default=False)

    @classmethod
    def ensure_default_exists(cls):
        if cls.objects.exists():
            return cls.objects.all()

        base_slug = slugify("Standard Admission Form")
        slug = base_slug
        counter = 1
        while cls.objects.filter(slug=slug).exists():
            counter += 1
            slug = f"{base_slug}-{counter}"

        cls.objects.create(
            name="Standard Admission Form",
            slug=slug,
            description="Default admission form layout with core student fields.",
            school_name="Rosey Mozammel Women's College",
            school_address="Gurudaspur, Natore, Bangladesh",
            eiin_number="123456",
            slogan="Empowering Women Through Education",
            footer_text="Rosey Mozammel Women's College • Gurudaspur, Natore",
            footer_secondary_text="For admission assistance call 01309-124030",
            header_background_color="#1f2937",
            header_text_color="#ffffff",
            primary_color="#2563eb",
            accent_color="#1e40af",
            text_color="#111827",
            header_font_name="Helvetica-Bold",
            body_font_name="Helvetica",
            label_font_size=11,
            body_font_size=10,
            watermark_text="Rosey Mozammel Women's College",
            signature_caption="Guardian Signature",
            is_default=True,
            layout_metadata={"fields": DEFAULT_FIELD_SPECS},
        )
        return cls.objects.all()

    @classmethod
    def get_default(cls):
        cls.ensure_default_exists()
        return cls.objects.filter(is_default=True).first() or cls.objects.order_by("-updated_at").first()

    @property
    def field_definitions(self):
        """Return ordered form field definitions for the Student admission form."""
        metadata_fields = []
        if isinstance(self.layout_metadata, dict):
            metadata_fields = self.layout_metadata.get("fields", []) or []

        custom_fields = []
        for field in metadata_fields:
            name = field.get("name")
            base = FIELD_SPEC_BY_NAME.get(name)
            if not base:
                continue
            combined = {**base, **field}
            if not combined.get("visible", True):
                continue
            if not combined.get("label"):
                combined["label"] = base["label"]
            custom_fields.append(combined)

        if custom_fields:
            return custom_fields

        # Default ordered fields
        return [field for field in DEFAULT_FIELD_SPECS if field.get("visible", True)]


class AdmissionFormSubmission(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
    )

    template = models.ForeignKey(
        AdmissionFormTemplate,
        on_delete=models.PROTECT,
        related_name="submissions",
    )
    form_data = models.JSONField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    gateway_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        name = self.form_data.get("first_name") or ""
        last = self.form_data.get("last_name") or ""
        full_name = f"{name} {last}".strip() or "Admission Form"
        return f"{full_name} - {self.status}"


class AdmissionPaymentIntent(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
    )

    template = models.ForeignKey(
        AdmissionFormTemplate,
        on_delete=models.PROTECT,
        related_name="payment_intents",
    )
    form_data = models.JSONField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    gateway_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        name = self.form_data.get("first_name") or ""
        last = self.form_data.get("last_name") or ""
        full_name = f"{name} {last}".strip() or "Admission Payment"
        return f"{full_name} - {self.status}"
