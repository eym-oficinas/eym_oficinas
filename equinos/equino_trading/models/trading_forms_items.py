# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.http import request

class trading_forms_items(models.Model):
    _name = 'trading.forms.items'
    _description = 'Trading Forms Items'
    
    name = fields.Char(string='Name, Registered Name, or Description')
    gender = fields.Many2one('trading.genders', string='Gender')
    specie_id = fields.Many2one('trading.species', string='Specie')
    breed_id = fields.Many2one('trading.breeds', string='Breed') 
    age = fields.Integer(string='Age')
    color_id = fields.Many2one('trading.colors', string='Color')
    id_number_microchip = fields.Char( string='ID Number (Micro Chip) or Description')
    final_customer = fields.Char(string='Final Customer, Name & Adress (at least 1 days befor to shipp)')
    t_number = fields.Char(string='T #')
    driver_id = fields.Char(string='Driver Contact to Pick Up (2 days before relase)')
    form_id = fields.Many2one('trading.forms', string='Form', inverse_name="form_item_ids")
    
    def get_item_data(self):
        response = {
            'genders': request.env['trading.genders'].sudo().search_read([], ['id','name']),
            'specie_ids': request.env['trading.species'].sudo().search_read([], ['id','name']),
            'breed_ids': request.env['trading.breeds'].sudo().search_read([], ['id','name']),
            'color_ids': request.env['trading.colors'].sudo().search_read([], ['id','name']),
            'microchip_ids': request.env['trading.microchips'].sudo().search_read([], ['id','name']),
        }
        return response