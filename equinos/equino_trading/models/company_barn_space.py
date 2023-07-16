# -*- coding: utf-8 -*-

from odoo import models, fields
class company_barn_space(models.Model):
    _name = 'company.barn.space'
    _description = 'Company Barn Space'
    
    name = fields.Char(string='Name')
    company_barn_id = fields.Many2one('company.barn', string='Company Barn Space')