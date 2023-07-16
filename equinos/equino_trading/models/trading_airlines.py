# -*- coding: utf-8 -*-

from odoo import models, fields, api
class trading_airlines(models.Model):
    _name = 'trading.airlines'
    _description = 'Airline'
    
    name = fields.Char(string='Name')