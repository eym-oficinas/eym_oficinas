# -*- coding: utf-8 -*-

from odoo import models, fields, api
class trading_species(models.Model):
    _name = 'trading.species'
    _description = 'Trading Species'
    
    name = fields.Char(string='Name')