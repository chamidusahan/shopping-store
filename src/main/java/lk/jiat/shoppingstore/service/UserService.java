package lk.jiat.shoppingstore.service;

import com.google.gson.JsonObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.core.Application;
import jakarta.ws.rs.core.Context;
import lk.jiat.shoppingstore.dto.UserDTO;
import lk.jiat.shoppingstore.entity.Address;
import lk.jiat.shoppingstore.entity.City;
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

    public String getLoggedInUserProfile(HttpServletRequest request) {
        JsonObject response = new JsonObject();
        HttpSession httpSession = request.getSession(false);

        if (httpSession == null || httpSession.getAttribute("user") == null) {
            response.addProperty("authenticated", false);
            return AppUtil.GSON.toJson(response);
        }

        UserDTO sessionUser = (UserDTO) httpSession.getAttribute("user");
        Session session = HibernateUtil.getSessionFactory().openSession();

        try {
            User user = session.get(User.class, sessionUser.getId());
            if (user == null) {
                response.addProperty("authenticated", false);
                return AppUtil.GSON.toJson(response);
            }

            Address address = session.createNamedQuery("Address.findPrimaryByUserId", Address.class)
                    .setParameter("userId", user.getId())
                    .setMaxResults(1)
                    .uniqueResult();

            response.addProperty("authenticated", true);
            response.add("user", buildUserProfileJson(user, address));
            return AppUtil.GSON.toJson(response);
        } finally {
            session.close();
        }
    }

    public String saveProfile(UserDTO userDTO, HttpServletRequest request) {
        JsonObject response = new JsonObject();
        boolean status = false;
        String message;

        HttpSession httpSession = request.getSession(false);
        if (httpSession == null || httpSession.getAttribute("user") == null) {
            response.addProperty("status", false);
            response.addProperty("message", "You must be logged in to update your profile");
            return AppUtil.GSON.toJson(response);
        }

        if (userDTO == null) {
            message = "Invalid request";
        } else if (userDTO.getEmail() == null || userDTO.getEmail().isBlank()) {
            message = "Email is required";
        } else if (!userDTO.getEmail().matches(Validator.EMAIL_VALIDATION)) {
            message = "Invalid email address";
        } else if (userDTO.getMobile() == null || userDTO.getMobile().isBlank()) {
            message = "Mobile number is required";
        } else if (!userDTO.getMobile().matches(Validator.MOBILE_VALIDATION)) {
            message = "Invalid mobile number";
        } else if (userDTO.getLineOne() == null || userDTO.getLineOne().isBlank()) {
            message = "Address line 1 is required";
        } else if (userDTO.getCityName() == null || userDTO.getCityName().isBlank()) {
            message = "City is required";
        } else {
            Session session = HibernateUtil.getSessionFactory().openSession();

            try {
                UserDTO sessionUser = (UserDTO) httpSession.getAttribute("user");
                User user = session.get(User.class, sessionUser.getId());

                if (user == null) {
                    message = "User account not found";
                } else {
                    User emailOwner = session.createNamedQuery("User.getByEmail", User.class)
                            .setParameter("email", userDTO.getEmail().trim())
                            .getSingleResultOrNull();

                    if (emailOwner != null && emailOwner.getId() != user.getId()) {
                        message = "Email already exists. Please use another email";
                    } else {
                        Transaction tx = session.beginTransaction();
                        try {
                            user.setEmail(userDTO.getEmail().trim());

                            City city = session.createNamedQuery("City.getByName", City.class)
                                    .setParameter("name", userDTO.getCityName().trim())
                                    .getSingleResultOrNull();

                            if (city == null) {
                                city = new City();
                                city.setName(userDTO.getCityName().trim());
                                session.persist(city);
                            }

                            Address address = session.createNamedQuery("Address.findPrimaryByUserId", Address.class)
                                    .setParameter("userId", user.getId())
                                    .setMaxResults(1)
                                    .uniqueResult();

                            if (address == null) {
                                address = new Address();
                                address.setUser(user);
                                address.setPrimary(true);
                            }

                            address.setAddressName(trimToNull(userDTO.getAddressName()));
                            address.setLineOne(userDTO.getLineOne().trim());
                            address.setLineTwo(trimToNull(userDTO.getLineTwo()));
                            address.setPostalCode(trimToNull(userDTO.getPostalCode()));
                            address.setMobile(userDTO.getMobile().trim());
                            address.setCity(city);
                            address.setUser(user);
                            address.setPrimary(true);

                            if (address.getId() == 0) {
                                session.persist(address);
                            }

                            tx.commit();

                            UserDTO updatedSessionUser = new UserDTO();
                            updatedSessionUser.setId(user.getId());
                            updatedSessionUser.setFirstName(user.getFirstName());
                            updatedSessionUser.setLastName(user.getLastName());
                            updatedSessionUser.setEmail(user.getEmail());
                            httpSession.setAttribute("user", updatedSessionUser);

                            status = true;
                            message = "Profile updated successfully";
                        } catch (Exception e) {
                            tx.rollback();
                            e.printStackTrace();
                            message = "Profile update failed: " + e.getMessage();
                        }
                    }
                }
            } finally {
                session.close();
            }
        }

        response.addProperty("status", status);
        response.addProperty("message", message);

        if (status) {
            Session session = HibernateUtil.getSessionFactory().openSession();
            try {
                UserDTO sessionUser = (UserDTO) httpSession.getAttribute("user");
                User user = session.get(User.class, sessionUser.getId());
                Address address = session.createNamedQuery("Address.findPrimaryByUserId", Address.class)
                        .setParameter("userId", user.getId())
                        .setMaxResults(1)
                        .uniqueResult();
                response.add("user", buildUserProfileJson(user, address));
            } finally {
                session.close();
            }
        }

        return AppUtil.GSON.toJson(response);
    }

    private JsonObject buildUserProfileJson(User user, Address address) {
        JsonObject userData = new JsonObject();
        userData.addProperty("id", user.getId());
        userData.addProperty("firstName", user.getFirstName());
        userData.addProperty("lastName", user.getLastName());
        userData.addProperty("fullName", user.getFirstName() + " " + user.getLastName());
        userData.addProperty("email", user.getEmail());

        if (address != null) {
            userData.addProperty("addressName", address.getAddressName());
            userData.addProperty("lineOne", address.getLineOne());
            userData.addProperty("lineTwo", address.getLineTwo());
            userData.addProperty("postalCode", address.getPostalCode());
            userData.addProperty("mobile", address.getMobile());

            if (address.getCity() != null) {
                userData.addProperty("cityId", address.getCity().getId());
                userData.addProperty("cityName", address.getCity().getName());
            }
        }

        if (user.getCreatedAt() != null) {
            userData.addProperty("sinceAt", user.getCreatedAt().toString());
        }

        if (user.getUpdatedAt() != null) {
            userData.addProperty("updatedAt", user.getUpdatedAt().toString());
        }

        return userData;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

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
