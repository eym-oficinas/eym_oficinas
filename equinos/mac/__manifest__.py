# -*- coding: utf-8 -*-
{
    'name': "mac",
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
                    'animal_center',
                    'equino_trading',
               ],
    'data': [   
                'security/ir.model.access.csv',
                'views/reservations.xml',
                'views/services_cleaning.xml',
                'views/services_feeding.xml',
                'views/services_veterinary.xml',                
                'views/menus.xml',
            ],
}