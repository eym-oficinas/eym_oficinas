# -*- coding: utf-8 -*-
{
    'name': "crm_project",
    'summary': """ Creates projects from customer relationship managment""",
    'description': """""",
    'author': "Alexander Grisales Rivera",
    'website': "",
    'category': 'crm-project',
    'version': '15.0.1',
    'depends': [
                'base',
                'crm',
                'project'
               ],
    'data': [
             'views/crm_lead.xml',
             'views/crm_project_to_repairs_views.xml',
            ],
}