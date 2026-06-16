package lk.jiat.shoppingstore.mail;

import io.rocketbase.mail.model.HtmlTextEmail;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import lk.jiat.shoppingstore.util.Env;

public class VerificationMail extends Mailable{

    private final String to;
    private final String verificationCode;

    public VerificationMail(String to, String verificationCode) {
        this.to = to;
        this.verificationCode = verificationCode;
    }

    @Override
    public void build(Message message) throws MessagingException {

        message.setRecipient(Message.RecipientType.TO, new InternetAddress(to));
        message.setSubject("Email Verification Code - " + Env.getProperty("app.name"));

        String appURL = Env.getProperty("app.url");
        String verifyURL = appURL+"/verify-account.html?email="+ to + "&verificationCode=" +verificationCode;

        HtmlTextEmail htmlTextEmail = getEmailTemplateBuilder()
                .header()
                .logo("https://upload.wikimedia.org/wikipedia/commons/e/eb/SmartTradePI.png").logoHeight(40).and()
                .text("Welcome "+ to).h1().center().and()
                .text("Thank for register in our website").center().and()
                .text("To verify your email, please click on the button bellow").center().and()
                .text("Your Verification Code is: <br/>" + verificationCode + "<br/>").center().and()
                .button("Verify Your Email", verifyURL).blue().center().and()
                .text("If you have a any trouble please this link in your browser").center().and()
                .text("<a href=" +verifyURL+">"+verifyURL+"</a>").center().and()
                .copyright(Env.getProperty("app.name")).url(appURL).suffix("All Rights Reserved").and()
                .build();


        message.setContent(htmlTextEmail.getHtml(), "text/html; charset=utf-8");

    }
}
