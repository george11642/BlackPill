# Stripe Push Provisioning classes
-keep class com.stripe.android.pushProvisioning.** { *; }
-keepclassmembers class com.stripe.android.pushProvisioning.** { *; }

# Stripe classes
-keep class com.stripe.** { *; }
-dontwarn com.stripe.**

# React Native Stripe SDK
-keep class com.reactnativestripesdk.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

