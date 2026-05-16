from ninja_extra import api_controller,route
from ninja_extra.permissions import IsAuthenticated,AllowAny
from stock.schemas import StockProducerSchema,StockProducerCreate, FarmCreateSchema, FarmResponseSchema, StockOriginSchema, StockOriginCreate, StockTransporterSchema, StockTransporterCreate, StockDestinationSchema, StockDestinationCreate
from stock.models import StockProducer, Farm, StockOrigin, StockTransporter, StockDestination
from user.models import TracaoUser, Notification
from django.shortcuts import get_object_or_404


@api_controller('/stock',auth=None)
class StockController:
    @route.post('/stock_producer',response=StockProducerSchema)
    def create_stock_producer(self,stock_producer:StockProducerCreate):
        data = stock_producer.model_dump()
        farm_id = data.pop('farm_id', None)
        producer_id = data.pop('producer')
        coop_id = data.pop('cooperative')
        
        stock = StockProducer.objects.create(
            producer_id=producer_id,
            cooperative_id=coop_id,
            farm_id=farm_id,
            **data
        )

        # Créer une notification pour le magasinier/coopérative
        Notification.objects.create(
            user_id=coop_id,
            type='LOT_CREATED',
            message=f"Nouveau lot de {stock.weight}kg de {stock.product_type} reçu de {stock.producer.first_name} {stock.producer.last_name}.",
            metadata={'lot_id': stock.id, 'producer_id': producer_id}
        )

        return stock

    @route.get('/all_stock_producer',response=list[StockProducerSchema])
    def get_all_stock_producer(self):
        return StockProducer.objects.all()

    @route.get('/producer_stocks/{producer_id}', response=list[StockProducerSchema])
    def get_producer_stocks(self, producer_id: int):
        return StockProducer.objects.filter(producer_id=producer_id)

    @route.post('/stock_origin', response=StockOriginSchema)
    def create_stock_origin(self, data: StockOriginCreate):
        origin = StockOrigin.objects.create(**data.model_dump())
        stock = origin.producer_stock
        
        # Créer une notification pour le producteur
        Notification.objects.create(
            user=stock.producer,
            type='LOT_VALIDATED',
            message=f"Votre lot de {stock.weight}kg de {stock.product_type} a été validé par le magasinier {origin.cooperative.org_name or origin.cooperative.email}.",
            metadata={'lot_id': stock.id, 'batch_number': stock.batch_number}
        )
        
        return origin

    @route.get('/all_stock_origin', response=list[StockOriginSchema])
    def get_all_stock_origin(self):
        return StockOrigin.objects.all()

    @route.get('/cooperative_stocks/{cooperative_id}', response=list[StockOriginSchema])
    def get_cooperative_stocks(self, cooperative_id: int):
        return StockOrigin.objects.filter(cooperative_id=cooperative_id)

    @route.post('/stock_transporter', response=StockTransporterSchema)
    def create_stock_transporter(self, data: StockTransporterCreate):
        return StockTransporter.objects.create(**data.model_dump())

    @route.get('/all_stock_transporter', response=list[StockTransporterSchema])
    def get_all_stock_transporter(self):
        return StockTransporter.objects.all()

    @route.post('/stock_destination', response=StockDestinationSchema)
    def create_stock_destination(self, data: StockDestinationCreate):
        return StockDestination.objects.create(**data.model_dump())

    @route.get('/all_stock_destination', response=list[StockDestinationSchema])
    def get_all_stock_destination(self):
        return StockDestination.objects.all()

    @route.post('/farms', response=FarmResponseSchema)
    def create_farm(self, farm_data: FarmCreateSchema):
        data = farm_data.model_dump()
        producer_id = data.pop('producer_id')
        farm = Farm.objects.create(producer_id=producer_id, **data)
        return farm

    @route.get('/farms', response=list[FarmResponseSchema])
    def get_all_farms(self):
        return Farm.objects.all()

    @route.post('/farms/{farm_id}/verify', response=FarmResponseSchema)
    def verify_farm(self, farm_id: int, cooperative_id: int):
        farm = get_object_or_404(Farm, id=farm_id)
        farm.is_verified_by_coop = True
        farm.verified_by_id = cooperative_id
        farm.save()
        return farm
    
    