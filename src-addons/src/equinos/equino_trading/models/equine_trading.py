# -*- coding: utf-8 -*-

from odoo import models, fields
class equine_trading(models.Model):
    _name = 'equine.trading'
    _description = 'Equine Trading'
    
    name = fields.Char(string='Name')