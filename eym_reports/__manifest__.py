# -*- coding: utf-8 -*-
{
    'name': "Reportes Personalizados",
    'summary': """""",
    'description': """""",
    'author': "Alexander Grisales Rivera",
    'website': "https://api.whatsapp.com/send?phone=573128097090",
    'category': 'Uncategorized',
    'version': '0.1',
    'depends': [
                    'base',
                    'account',
                    'sale',
                    'sale_management'
               ],
    'data': [
                'reports/external_layout_header.xml',
                'reports/report_invoice_document.xml',
                'reports/report_saleorder_document.xml',
                'reports/report_purchaseorder_document.xml',
                'reports/report_repairorder.xml',
                'reports/report_purchasequotation_document.xml'
            ],
}