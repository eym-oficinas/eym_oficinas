# -*- coding: utf-8 -*-
{
    'name': "animal_center",
    'summary': """""",
    'description': """""",
    'author': "",
    'website': "",
    'category': '',
    'version': '16.0',
    'depends': [
                    'base',
                    'account',
                    'project',
                    'crm',
                    'hotel',
                    'calendar',
                    'product',
                    'stock',
                    'website_sale',
                    'equino_trading',
               ],
    'data': [

                'security/ir.model.access.csv',

                'data/unit_categories.xml',
                'data/units.xml',
                'data/products.xml',
                'data/rooms.xml',
                
                'views/units.xml',
                'views/rooms.xml',
                'views/product_product.xml',
                'views/reservations.xml',
                'views/sale_order.xml',
                'views/unit_category.xml',
                'views/calendar_event.xml',
                'views/trading_containers.xml',
                
                'views/menus.xml',
                
                
            ],
}