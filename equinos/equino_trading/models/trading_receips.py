# -*- coding: utf-8 -*-

from odoo import models, fields, _
from odoo.exceptions import Warning

class trading_receips(models.Model):
    _name = 'trading.receips'
    _description = 'Trading Receips'
    
    name = fields.Char(string='Name')
    contact_ids = fields.Many2many('res.partner', string='Contacts')