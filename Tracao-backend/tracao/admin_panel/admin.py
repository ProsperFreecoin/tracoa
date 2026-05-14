from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm, UserChangeForm as BaseUserChangeForm
from user.models import (
    TracaoUser,
    ProfilePic,
    KYCDocument,
)
from stock.models import (
    StockProducer,
    StockOrigin,
    StockTransporter,
    StockDestination,
)


# User creation

class UserCreationForm(BaseUserCreationForm):
    class Meta:
        model = TracaoUser
        fields = ["email", "first_name", "last_name", "phone_number", "country"]


class UserChangeForm(BaseUserChangeForm):
    class Meta:
        model = TracaoUser
        fields = "__all__"


@admin.register(TracaoUser)
class UserAdmin(BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    list_display = [
        "email", "first_name", "last_name", "phone_number", "country",
        "is_transporter", "is_farmer", "is_buyer", "is_store",
        "is_transformer", "is_private_buyer",
        "is_staff", "is_active", "created_at",
    ]
    list_filter = [
        "is_transporter", "is_farmer", "is_buyer",
        "is_store", "is_transformer", "is_private_buyer",
        "is_staff", "is_superuser", "is_active",
    ]

    fieldsets = [
        (None, {"fields": ["email", "password"]}),
        ("Individuel (Farmer / Buyer)", {"fields": [
            "first_name", "last_name", "cooperative_name",
            "phone_number", "country", "situation_geo",
        ]}),
        ("Organisation / Entreprise", {"fields": [
            "org_name", "address", "certification",
            "person_to_call", "ptc_number",
            "record_number", "tax_number",
            "legal_number", "website",
        ]}),
        ("Magasin", {"fields": [
            "store_name", "store_address", "store_certification",
        ]}),
        ("Rôles", {"fields": [
            "is_transporter", "is_farmer", "is_buyer",
            "is_transformer", "is_private_buyer", "is_store",
            "hired_by",
        ]}),
        ("Permissions", {"fields": ["is_staff", "is_active", "is_superuser", "groups", "user_permissions"]}),
        ("Dates", {"fields": ["last_login"], "classes": ["collapse"]}),
    ]

    add_fieldsets = [
        (None, {
            "classes": ["wide"],
            "fields": [
                "email", "password1", "password2",
                "first_name", "last_name",
                "phone_number", "country",
                "is_farmer", "is_buyer", "is_store",
                "is_transformer", "is_private_buyer", "is_transporter",
                "is_staff", "is_active",
            ],
        }),
    ]

    search_fields = ["email", "first_name", "last_name", "org_name", "store_name"]
    ordering = ["email"]
    filter_horizontal = ["groups", "user_permissions"]
    readonly_fields = ["last_login"]


# profil picture

@admin.register(ProfilePic)
class ProfilePicAdmin(admin.ModelAdmin):
    list_display = ["user", "profile_picture"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]

@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display = ["user", "status", "submitted_at", "reviewed_at"]
    list_filter = ["status", "submitted_at"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]
    readonly_fields = ["submitted_at"]
    list_editable = ["status"]


# Stock Management 


@admin.register(StockProducer)
class StockProducerAdmin(admin.ModelAdmin):
    list_display = ["producer", "cooperative", "product_type", "weight", "date", "origin", "surface_size", "production_size"]
    list_filter = ["product_type", "date", "origin"]
    search_fields = ["producer__first_name", "producer__last_name", "cooperative__cooperative_name", "origin"]
    date_hierarchy = "date"
    ordering = ["-date"]


@admin.register(StockOrigin)
class StockOriginAdmin(admin.ModelAdmin):
    list_display = ["cooperative", "producer_stock"]
    search_fields = ["cooperative__cooperative_name", "producer_stock__producer__first_name"]


@admin.register(StockTransporter)
class StockTransporterAdmin(admin.ModelAdmin):
    list_display = ["transporter", "cooperative", "stock_origin"]
    search_fields = [
        "transporter__first_name", "transporter__last_name",
        "cooperative__cooperative_name",
    ]
    list_filter = ["cooperative"]

@admin.register(StockDestination)
class StockDestinationAdmin(admin.ModelAdmin):
    list_display = ["exporter", "transporter", "stock_transporter"]
    search_fields = ["exporter__cooperative_name", "transporter__first_name", "transporter__last_name"]
