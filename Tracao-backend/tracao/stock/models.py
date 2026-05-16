from django.db import models
from user.models import TracaoUser

# Stock Management 


# Producteur

class Farm(models.Model):
    producer = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, related_name='farms', limit_choices_to={'is_farmer': True})
    name = models.CharField(max_length=255, help_text="Nom du champ ou de la plantation")
    polygon_coordinates = models.JSONField(help_text="Liste des coordonnées GPS formant le contour du champ [{'lat': X, 'lng': Y}, ...]")
    area_hectares = models.FloatField(blank=True, null=True, help_text="Surface estimée en hectares")
    
    is_verified_by_coop = models.BooleanField(default=False)
    verified_by = models.ForeignKey(TracaoUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_farms', limit_choices_to={'is_store': True})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.producer.email} {'(Vérifié)' if self.is_verified_by_coop else ''}"

class StockProducer(models.Model):
    producer = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, limit_choices_to={'is_farmer': True}, related_name='producer_stocks')
    cooperative = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, limit_choices_to={'is_store': True}, related_name='store_received_stocks', verbose_name="Magasinier")

    TYPE_CHOICES = [
        ('cacao', 'Cacao'),
        ('cafe', 'Cafe'),
    ]

    weight = models.FloatField(blank=True, null=True)
    date = models.DateField()
    batch_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    product_type = models.CharField(max_length=100, choices=TYPE_CHOICES)
    species = models.TextField(blank=True, null=True)
    origin = models.CharField(max_length=200, help_text="Région ou village", blank=True, null=True)
    farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, blank=True, related_name='harvests', help_text="Le champ spécifique (polygone GPS) d'où provient la récolte.")
    surface_size = models.FloatField(blank=True, null=True) # in hectares
    production_size = models.FloatField(blank=True, null=True) # in Kg
    
    def __str__(self):
        return f"{self.producer.first_name} { self.producer.last_name} to {self.cooperative.store_name or self.cooperative.email}"
    

# coopérative d'origine (Magasin de départ)

class StockOrigin(models.Model):
    cooperative = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, limit_choices_to={'is_store': True}, related_name='origin_stocks', verbose_name="Magasinier")
    producer_stock = models.ForeignKey(StockProducer, on_delete=models.CASCADE, related_name='origin_records')

    is_confirmed = models.BooleanField(default=False)
    
    
    def __str__(self):
        return f"{self.producer_stock.producer.first_name} { self.producer_stock.producer.last_name} from {self.cooperative.cooperative_name} with {self.producer_stock.weight}kg of {self.producer_stock.product_type}"


# Acheteur

class StockTransporter(models.Model):
    transporter = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, limit_choices_to={'is_transporter': True}, related_name='transported_stocks')
    receiver = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, limit_choices_to={'is_store': True}, related_name='received_transports', verbose_name="Magasin de destination")
    stock_origin = models.ForeignKey(StockOrigin, on_delete=models.CASCADE, related_name='transporter_records')

    def __str__(self):
        return f"{self.transporter.first_name} { self.transporter.last_name} to {self.receiver.store_name or self.receiver.email}"


# Acheteur final / Exportateur (Destination)

class StockDestination(models.Model):
    exporter = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, limit_choices_to={'is_private_buyer': True}, related_name='received_export_stocks', verbose_name="Exportateur / Acheteur")
    transporter = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, limit_choices_to={'is_transporter': True}, related_name='delivered_stocks')
    stock_transporter = models.ForeignKey(StockTransporter, on_delete=models.CASCADE, related_name='destination_records')

    def __str__(self):
        return f"{self.transporter.first_name} {self.transporter.last_name} to {self.exporter.org_name or self.exporter.email}"