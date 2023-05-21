# -*- coding: utf-8 -*-
# from odoo import http


# class /equiman/custom/addons/crmRepair(http.Controller):
#     @http.route('//equiman/custom/addons/crm_repair//equiman/custom/addons/crm_repair/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('//equiman/custom/addons/crm_repair//equiman/custom/addons/crm_repair/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('/equiman/custom/addons/crm_repair.listing', {
#             'root': '//equiman/custom/addons/crm_repair//equiman/custom/addons/crm_repair',
#             'objects': http.request.env['/equiman/custom/addons/crm_repair./equiman/custom/addons/crm_repair'].search([]),
#         })

#     @http.route('//equiman/custom/addons/crm_repair//equiman/custom/addons/crm_repair/objects/<model("/equiman/custom/addons/crm_repair./equiman/custom/addons/crm_repair"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('/equiman/custom/addons/crm_repair.object', {
#             'object': obj
#         })
