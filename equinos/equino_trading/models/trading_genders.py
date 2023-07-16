# -*- coding: utf-8 -*-
#
from odoo import models, fields, api
class trading_genders(models.Model):
    _name = 'trading.genders'
    _description = 'Trading Genders'
    
    name = fields.Char(string='Name')