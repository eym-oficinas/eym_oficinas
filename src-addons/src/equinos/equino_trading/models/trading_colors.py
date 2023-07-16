# -*- coding: utf-8 -*-

from odoo import models, fields, api
class trading_colorss(models.Model):
    _name = 'trading.colors'
    _description = 'Trading Colors'
    
    name = fields.Char(string="Color")
    color = fields.Integer(string="Picker")