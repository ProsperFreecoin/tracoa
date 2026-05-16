from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('user', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tracaouser',
            name='legal_number',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='tracaouser',
            name='record_number',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='tracaouser',
            name='tax_number',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
