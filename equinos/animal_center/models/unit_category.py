# -*- coding: utf-8 -*-

from odoo import models, fields, api


class unit_category(models.Model):
    _name = 'unit.categories'
    _description = 'Unit Categories'
    
    name = fields.Char(string='Name')
    sale_order_ids = fields.Many2many('sale.order', string='Sale Orders', inverse_name="unit_category_id")
    service_type = fields.Selection(string='Service Type', selection=[['export','Export'],['import','Import'],['transit','Transit']])       
    unit_ids = fields.One2many('hotel.room.type', string='Units', inverse_name="unit_category_id")