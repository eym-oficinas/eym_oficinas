# -*- coding: utf-8 -*-
# from odoo import http


# class /odoo-161/custom/addons/equinos/animalCenter(http.Controller):
#     @http.route('//odoo-161/custom/addons/equinos/animal_center//odoo-161/custom/addons/equinos/animal_center', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('//odoo-161/custom/addons/equinos/animal_center//odoo-161/custom/addons/equinos/animal_center/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('/odoo-161/custom/addons/equinos/animal_center.listing', {
#             'root': '//odoo-161/custom/addons/equinos/animal_center//odoo-161/custom/addons/equinos/animal_center',
#             'objects': http.request.env['/odoo-161/custom/addons/equinos/animal_center./odoo-161/custom/addons/equinos/animal_center'].search([]),
#         })

#     @http.route('//odoo-161/custom/addons/equinos/animal_center//odoo-161/custom/addons/equinos/animal_center/objects/<model("/odoo-161/custom/addons/equinos/animal_center./odoo-161/custom/addons/equinos/animal_center"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('/odoo-161/custom/addons/equinos/animal_center.object', {
#             'object': obj
#         })
