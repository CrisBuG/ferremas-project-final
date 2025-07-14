from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """
    Gestor personalizado para el modelo de usuario que utiliza email como identificador único
    en lugar de username.
    """
    def create_user(self, email, password=None, **extra_fields):
        """
        Crea y guarda un usuario con el email y contraseña proporcionados.
        """
        if not email:
            raise ValueError(_('El Email es obligatorio'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()  # Para usuarios de Google OAuth
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crea y guarda un superusuario con el email y contraseña proporcionados.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser debe tener is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser debe tener is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    """
    Modelo de usuario personalizado que utiliza email como identificador único
    y añade campos adicionales como rol, dirección y teléfono.
    """
    ROLE_CHOICES = (
        ('cliente', 'Cliente'),
        ('bodeguero', 'Bodeguero'),
        ('contador', 'Contador'),
        ('admin', 'Administrador'),
    )
    
    username = None
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cliente')
    
    # Campos existentes
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Nuevos campos para foto de perfil
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    
    # Nuevos campos para datos de envío
    shipping_first_name = models.CharField(max_length=150, blank=True, null=True)
    shipping_last_name = models.CharField(max_length=150, blank=True, null=True)
    shipping_company = models.CharField(max_length=200, blank=True, null=True)
    shipping_address = models.TextField(blank=True, null=True)
    shipping_city = models.CharField(max_length=100, blank=True, null=True)
    shipping_state = models.CharField(max_length=100, blank=True, null=True)
    shipping_postal_code = models.CharField(max_length=20, blank=True, null=True)
    shipping_country = models.CharField(max_length=100, blank=True, null=True, default='Chile')
    shipping_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Campos adicionales
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Masculino'), ('F', 'Femenino'), ('O', 'Otro')], blank=True, null=True)
    
    date_joined = models.DateTimeField(auto_now_add=True)
    
    # Campos para autenticación social
    auth0_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    is_social_account = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = CustomUserManager()
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def shipping_full_name(self):
        if self.shipping_first_name and self.shipping_last_name:
            return f"{self.shipping_first_name} {self.shipping_last_name}"
        return self.full_name
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')