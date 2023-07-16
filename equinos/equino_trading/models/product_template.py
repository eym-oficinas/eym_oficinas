# -*- coding: utf-8 -*-

from odoo import models, fields
class product_template(models.Model):
    _inherit = 'product.template'
    _description = 'Product Template'
    
    is_equine = fields.Boolean(string='Equine Trading')