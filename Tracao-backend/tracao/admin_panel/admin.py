from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm, UserChangeForm as BaseUserChangeForm
from user.models import (
    TracaoUser,
    ProfilePic,
    KYCDocument,
)



# USER ADMIN


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
        "is_transformer", "is_private_buyer", "is_certifier",
        "is_staff", "is_active", "is_verified", "created_at",
    ]
    list_filter = [
        "is_transporter", "is_farmer", "is_buyer",
        "is_store", "is_transformer", "is_private_buyer", "is_certifier",
        "is_staff", "is_superuser", "is_active", "is_verified",
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
            "is_transformer", "is_private_buyer", "is_store", "is_certifier",
            "hired_by",
        ]}),
        ("Vérification", {"fields": ["is_verified"]}),
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
                "is_transformer", "is_private_buyer", "is_transporter", "is_certifier",
                "is_staff", "is_active",
            ],
        }),
    ]

    search_fields = ["email", "first_name", "last_name", "org_name", "store_name"]
    ordering = ["email"]
    filter_horizontal = ["groups", "user_permissions"]
    readonly_fields = ["last_login"]



# PROFIL PICTURE & KYC


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
