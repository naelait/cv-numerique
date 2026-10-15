# Vibely — TFE (faits pour recruteurs)

## Qu’est-ce que Vibely ?
Application mobile de rencontres fondée sur des **croisements géolocalisés réels** et l’**affinité musicale Spotify**. Contrairement aux apps “rayon autour de moi”, un profil n’apparaît que si deux personnes se sont effectivement croisées (ex. métro, campus, festival, rue).

Auteur du TFE : Naël Ait — Bachelier Informatique de Gestion, EPHEC, année 2025-2026. Rapporteur : Vincent Fievez.

## Stack technique
- Client : **Flutter** (Android + iOS, une base de code) + **Riverpod**
- API : **ASP.NET Core 10**, **Minimal APIs**, **MediatR** (CQRS / handlers)
- Données : **SQL Server** + **EF Core**
- Auth : JWT, refresh tokens, **BCrypt** pour les mots de passe
- Temps réel : **SignalR** (chat / notifications in-app)
- Externes : **Spotify** (OAuth PKCE), **Stripe** (Checkout + webhooks + portail Plus)
- Photos : fichiers HTTPS, contrôle magic bytes (JPEG/PNG/WebP, max 5 Mo)

Alternatives écartées : Xamarin (vs Flutter), Provider (vs Riverpod), sessions cookie (vs JWT stateless).

## Règles métier clés (découverte)
- Croisement si deux fixes GPS à environ **120 m** et datant de moins de **45 minutes**
- Croisements visibles jusqu’à **7 jours**
- Écran Découvrir : uniquement ces profils, classés par **affinité musicale Spotify**
- Position d’autrui jamais affichée en temps réel (minimisation CNIL / vie privée)
- GPS en arrière-plan possible (l’app n’a pas à rester ouverte pour enregistrer un croisement)

## Parcours produit
Inscription / connexion → partage position → croisements → swipe (like / pass) → match → chat.
Offre Free : **10 likes / jour**. **Vibely Plus** : likes illimités, undo d’un pass, voir qui a liké. Paiement Stripe ; activation seulement après confirmation webhook signée.

## Fonctionnalités principales
Auth & profil, Spotify (connecter / sync / extraits), découverte GPS, likes/pass/matchs, chat temps réel, photos, abonnement Plus, préférences de notifications in-app.

## Objectifs du TFE
1. Formaliser le besoin (acteurs, exigences, UC, règles métier)
2. Prouver que filtre géographique + signal Spotify tiennent en modèle de données + API
3. Livrer un client Flutter démo (auth, Découvrir, chat, Spotify, abonnement)

## Hors périmètre (honnêteté recruteur)
Pas de back-office modération, pas de site web, pas de push FCM/APNs natifs (jeton d’installation + hook no-op), pas de mot de passe oublié, pas de publication App Store. Le TFE s’arrête à une **démo hors store**.

## Suites envisagées (non réalisées)
Modération / signalement, filtrage GPS indoor imprécis, FCM/APNs, reset password, éventuel web pour profil/matchs (pas Flutter web comme cible GPS).
