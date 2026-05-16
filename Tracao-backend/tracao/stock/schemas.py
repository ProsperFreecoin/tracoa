from ninja import Schema, ModelSchema
from typing import List, Dict, Any, Optional
from stock.models import StockProducer,StockOrigin,StockTransporter,Farm,StockDestination

class StockProducerSchema(ModelSchema):
    class Meta:
        model = StockProducer
        fields = ['id', 'producer','cooperative','weight','date','product_type','species','origin','surface_size','production_size', 'farm']

    batch_number: Optional[str] = None

    @staticmethod
    def resolve_batch_number(obj):
        try:
            return str(obj.batch.batch_number)
        except:
            return None

class StockOriginSchema(ModelSchema):
    class Meta:
        model = StockOrigin
        fields = ['id', 'cooperative','producer_stock','is_confirmed']

class StockTransporterSchema(ModelSchema):
    class Meta:
        model = StockTransporter
        fields = ['id', 'transporter','cooperative','stock_origin']

class StockProducerCreate(Schema):
    producer: int
    cooperative: int
    weight: Optional[float] = None
    date: str
    product_type: str
    species: Optional[str] = None
    origin: Optional[str] = None
    surface_size: Optional[float] = None
    production_size: Optional[float] = None
    farm_id: Optional[int] = None

class StockOriginCreate(Schema):
    cooperative: int
    producer_stock: int
    is_confirmed: bool = True

class StockTransporterCreate(Schema):
    transporter: int
    cooperative: int
    stock_origin: int

class StockDestinationSchema(ModelSchema):
    class Meta:
        model = StockDestination
        fields = ['id', 'exporter', 'transporter', 'stock_transporter']

class StockDestinationCreate(Schema):
    exporter: int
    transporter: int
    stock_transporter: int

class FarmCreateSchema(Schema):
    producer_id: int
    name: str
    polygon_coordinates: List[Dict[str, Any]]
    area_hectares: Optional[float] = None

class FarmResponseSchema(ModelSchema):
    class Meta:
        model = Farm
        fields = ['id', 'producer', 'name', 'polygon_coordinates', 'area_hectares', 'is_verified_by_coop', 'verified_by', 'created_at']

