from odoo import models, fields

class account_journal(models.Model):
    _inherit = 'account.journal'
    _description = 'Journals'
    
    terms_condictions = fields.Html('Terms and Condictions')