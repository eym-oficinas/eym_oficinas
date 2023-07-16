# -*- coding: utf-8 -*-

from odoo import models, fields
class company_barn(models.Model):
    _name = 'company.barn'
    _description = 'Company Barn'
    
    name = fields.Char(string='Name')
    company_barn_spaces_ids = fields.Many2one('company.barn.space', string='Company Barn ')