package lk.jiat.shoppingstore.service;

import com.google.gson.JsonObject;
import jakarta.persistence.NoResultException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.core.Application;
import jakarta.ws.rs.core.Context;
import lk.jiat.shoppingstore.dto.UserDTO;
import lk.jiat.shoppingstore.entity.Gender;
import lk.jiat.shoppingstore.entity.Status;
import lk.jiat.shoppingstore.entity.User;
import lk.jiat.shoppingstore.mail.VerificationMail;
import lk.jiat.shoppingstore.provider.MailServiceProvider;
import lk.jiat.shoppingstore.util.AppUtil;
import lk.jiat.shoppingstore.util.HibernateUtil;

import lk.jiat.shoppingstore.util.passwordUtil;
import lk.jiat.shoppingstore.validation.Validator;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.Transaction;

public class UserService {

    public String userLogin(UserDTO userDTO, @Context HttpServletRequest request) {

        JsonObject response = new JsonObject();
        boolean status = false;
        String message;


        if (userDTO == null) {
            message = "Invalid request";
        } else if (userDTO.getEmail() == null || userDTO.getEmail().isBlank()) {
            message = "Email is required";
        } else if (!userDTO.getEmail().matches(Validator.EMAIL_VALIDATION)) {
            message = "Invalid email address";
        } else if (userDTO.getPassword() == null || userDTO.getPassword().isBlank()) {
            message = "Password is required";
        } else {

            Session session = HibernateUtil.getSessionFactory().openSession();

            User user = session.createNamedQuery("User.getByEmail", User.class)
                    .setParameter("email", userDTO.getEmail())
                    .getSingleResultOrNull();

            if (user == null) {
                message = "Invalid email or password";
            } else {

                Status inactiveStatus = session.createNamedQuery("Status.findByValue", Status.class)
                        .setParameter("value", Status.Type.INACTIVE.name())
                        .getSingleResult();

                if (user.getStatus().equals(inactiveStatus)) {
                    message = "Your account is inactive. Please contact support";
                } else {
                    if (!passwordUtil.verifyPassword(
                            userDTO.getPassword(),
                            user.getPassword()
                    )) {
                        message = "Invalid email or password";
                    } else {

                        Status verifiedStatus = session.createNamedQuery("Status.findByValue", Status.class)
                                .setParameter("value", Status.Type.VERIFIED.name())
                                .getSingleResult();

                        if (!user.getStatus().equals(verifiedStatus)) {
                            message = "Please verify your account before login";
                        } else {

                            UserDTO sessionUserDTO = new UserDTO();
                            sessionUserDTO.setId(user.getId());
                            sessionUserDTO.setFirstName(user.getFirstName());
                            sessionUserDTO.setLastName(user.getLastName());
                            sessionUserDTO.setEmail(user.getEmail());    


                            HttpSession httpSession = request.getSession(true);
                            httpSession.setAttribute("user", sessionUserDTO);

                            status = true;
                            message = "Login successful";
                        }
                    }
                }
            }
            session.close();
        }

        response.addProperty("status", status);
        response.addProperty("message", message);

        return AppUtil.GSON.toJson(response);
    }



    public String addNewUser(UserDTO userDTO) {

        JsonObject response = new JsonObject();
        boolean status = false;
        String message;


        if (userDTO == null) {
            message = "Invalid request";
        } else if (userDTO.getFirstName() == null || userDTO.getFirstName().isBlank()) {
            message = "First name is required";
        } else if (userDTO.getLastName() == null || userDTO.getLastName().isBlank()) {
            message = "Last name is required";
        } else if (userDTO.getEmail() == null || userDTO.getEmail().isBlank()) {
            message = "Email is required";
        } else if (!userDTO.getEmail().matches(Validator.EMAIL_VALIDATION)) {
            message = "Invalid email address";
        } else if (userDTO.getPassword() == null || userDTO.getPassword().isBlank()) {
            message = "Password is required";
        } else if (!userDTO.getPassword().matches(Validator.PASSWORD_VALIDATION)) {
            message = "Password must be at least 8 characters long and include uppercase, lowercase, digit, and special character";
        } else {

            Session session = HibernateUtil.getSessionFactory().openSession();

            User existingUser = session.createNamedQuery("User.getByEmail", User.class)
                    .setParameter("email", userDTO.getEmail())
                    .getSingleResultOrNull();

            if (existingUser != null) {
                message = "Email already exists. Please use another email";
            } else {

                Transaction tx = session.beginTransaction();
                try {
                    User user = new User();
                    user.setFirstName(userDTO.getFirstName());
                    user.setLastName(userDTO.getLastName());
                    user.setEmail(userDTO.getEmail());

                    user.setPassword(passwordUtil.hashPassword(userDTO.getPassword()));

                    Status pendingStatus = session.createNamedQuery("Status.findByValue", Status.class)
                            .setParameter("value", Status.Type.VERIFIED.name())
                            .getSingleResult();

                    user.setStatus(pendingStatus);

                    session.persist(user);
                    tx.commit();

                    status = true;
                    message = "Account created successfully";

                } catch (Exception e) {
                    tx.rollback();
                    e.printStackTrace(); // DO NOT REMOVE while debugging
                    message = "Registration failed: " + e.getMessage();
                }

            }
            session.close();
        }

        response.addProperty("status", status);
        response.addProperty("message", message);

        return AppUtil.GSON.toJson(response);
    }





}
