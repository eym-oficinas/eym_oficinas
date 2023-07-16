# -*- coding: utf-8 -*-

from odoo import models, fields, api


class units(models.Model):
    _inherit = 'hotel.room.type'
    
    service_type = fields.Selection(string='Service Type', selection=[['export','Export'],['import','Import'],['transit','Transit']])
    sale_order_ids = fields.Many2many('sale.order', string='Sale Orders', inverse_name="unit_id")
    unit_category_id = fields.Many2one('unit.categories', string='Unit Category', inverse_name="unit_ids")
    capacity = fields.Integer(string='Capacity', default=7, readonly=True)