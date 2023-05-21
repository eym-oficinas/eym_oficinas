# -*- coding: utf-8 -*-
{
    'name': "crm_repair",

    'summary': """ Creates repairs from customer relationship managment""",

    'description': """""",
    'author': "Alexander Grisales Rivera",
    'website': "",
    'category': 'crm-repairs',
    'version': '14.1.0',
    'depends': [
                'base',
                'crm',
                'repair'
               ],
    'data': [
             'views/crm_lead.xml',
             'views/crm_opportunity_to_repairs_views.xml',
            ],
}
