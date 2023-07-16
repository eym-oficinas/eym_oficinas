# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError

class product_product(models.Model):
    _inherit = 'product.product'
    
    room_id = fields.Many2one('hotel.room', string='Product', inverse_name="product_id")
    unit_category_id = fields.Many2one('unit.categories', string='Product', related="room_id.unit_category_id", readonly=True)
    unit_id = fields.Many2one('hotel.room.type', string='Product', related="room_id.room_categ_id", readonly=True)
    
class product_template(models.Model):
    _inherit = 'product.template'
    
    
    def compute_isroom(self):
        for record in self:
            product = self.env['product.product'].sudo().search( [['product_tmpl_id','=',record.id]] , limit=1)            
            record.isroom = product.isroom
            
    isroom = fields.Boolean(string='Is Room', compute=compute_isroom, store=True)