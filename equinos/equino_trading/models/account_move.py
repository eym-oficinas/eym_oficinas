# -*- coding: utf-8 -*-

from odoo import models, fields
class account_move(models.Model):
    _inherit = 'account.move'
    _description = 'Invoices'
    
    terms_condictions = fields.Html('Terms and Condictions', readonly=False, related='journal_id.terms_condictions') 
    