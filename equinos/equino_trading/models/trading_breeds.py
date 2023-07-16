# -*- coding: utf-8 -*-

from odoo import models, fields, api
class trading_breds(models.Model):
    _name = 'trading.breeds'
    _description = 'Trading Breeds'
    
    name = fields.Char(string='Name')