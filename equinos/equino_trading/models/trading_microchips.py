# -*- coding: utf-8 -*-

from odoo import models, fields, api
class trading_identifier_type(models.Model):
    _name = 'trading.microchips'
    _description = 'Trading Microchips'
    
    name = fields.Char(string='Name')