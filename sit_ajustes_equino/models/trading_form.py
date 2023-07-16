from odoo import api, fields, models, tools, _
import logging
from odoo.exceptions import ValidationError
from datetime import datetime

_logger = logging.getLogger(__name__)



class sit_trading_form(models.Model):
    _inherit = 'trading.forms'

    # def sit_crm_share_shipping_form(self, form_id=None, gdrive=None):
    def sit_share_shipping_form(self, form_id=None, gdrive=None):
        _logger.info('SIT gdrive url:  %s', gdrive)
        if form_id:
            self = form_id

        # url = self.share_link()
        url = gdrive
        self.invite_url = url
        _logger.info('SIT self url:  %s {%s}', self, self.user_id.email_formatted)
        # _logger.info('SIT self url:  %s {%s}', self, self.email_formatted)
        _logger.info('SIT self url:  %s {%s}', self, self.shipper_id.email)   
        # mail_template = self.env.ref('equino_trading.email_invite_shipping_form')
        mail_template = self.env.ref('sit_ajustes_equino.sit_email_invite_shipping_form')
        # _logger.info('SIT mail_template: (%s)  %s', self.id, mail_template.search_read([]))

        mail_record = mail_template.send_mail(self.id, force_send=True)
        _logger.info('SIT mail_record:  %s', mail_record)

        return mail_record      